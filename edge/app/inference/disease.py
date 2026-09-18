import os
import time
import json
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
from PIL import Image
import cv2
import onnxruntime as ort

from edge.app.inference.base import BaseInferenceEngine
from edge.app.config.settings import edge_settings

class OnnxDiseaseClassifier(BaseInferenceEngine):
    """
    Production Edge ONNX Classifier for crop foliar disease detection.
    Runs locally on CPU/CUDA with strict confidence gating and latency instrumentation.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        config_path: Optional[str] = None,
        db_path: Optional[str] = None,
        confidence_threshold: float = 60.0,
        enable_cuda: bool = False
    ):
        super().__init__(name="MobileNetV2-PlantPathology-ONNX")
        self.model_path = model_path or edge_settings.models.disease_model_path
        self.config_path = config_path or edge_settings.models.disease_config_path
        self.db_path = db_path or edge_settings.models.disease_db_path
        self.confidence_threshold = confidence_threshold
        self.enable_cuda = enable_cuda

        self.session: Optional[ort.InferenceSession] = None
        self.id2label: Dict[str, str] = {}
        self.disease_db: List[Dict[str, Any]] = []
        self.input_name: str = "pixel_values"
        self.output_name: str = "logits"

        self.load()

    def load(self) -> bool:
        try:
            if not os.path.exists(self.model_path):
                self.load_error = f"ONNX model file not found at: {self.model_path}"
                self.is_loaded = False
                return False

            providers = ["CPUExecutionProvider"]
            if self.enable_cuda and "CUDAExecutionProvider" in ort.get_available_providers():
                providers.insert(0, "CUDAExecutionProvider")

            opts = ort.SessionOptions()
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            opts.intra_op_num_threads = 4

            self.session = ort.InferenceSession(self.model_path, sess_options=opts, providers=providers)
            self.execution_provider = self.session.get_providers()[0]

            # Detect input & output tensor names
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name

            # Load label mapping
            if os.path.exists(self.config_path):
                with open(self.config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.id2label = cfg.get("id2label", {})

            # Load disease database if available
            if os.path.exists(self.db_path):
                with open(self.db_path, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    self.disease_db = [p for p in raw if p.get("name") != "Background_without_leaves"]

            self.is_loaded = True
            self.load_error = None
            return True

        except Exception as e:
            self.load_error = str(e)
            self.is_loaded = False
            return False

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        """
        Preprocesses OpenCV BGR frame for MobileNetV2:
        - Convert BGR to RGB
        - Resize shortest side to 256
        - Center crop to 224x224
        - Normalize: (pixel / 255.0 - 0.5) / 0.5
        - Transpose to (1, 3, 224, 224) float32
        """
        if frame is None or frame.size == 0:
            raise ValueError("Empty frame provided for inference")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]

        if w < h:
            new_w = 256
            new_h = int(h * (256.0 / w))
        else:
            new_h = 256
            new_w = int(w * (256.0 / h))

        resized = cv2.resize(rgb, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        start_x = max(0, (new_w - 224) // 2)
        start_y = max(0, (new_h - 224) // 2)
        cropped = resized[start_y:start_y + 224, start_x:start_x + 224]

        # Float normalization [-1.0, 1.0]
        norm = (cropped.astype(np.float32) / 255.0 - 0.5) / 0.5
        # (224, 224, 3) -> (3, 224, 224) -> (1, 3, 224, 224)
        ch_first = np.transpose(norm, (2, 0, 1))
        batch = np.expand_dims(ch_first, axis=0)
        return batch

    def detect_leaf_roi(self, frame: np.ndarray) -> Tuple[int, int, int, int]:
        """Fast green/leaf contour detection for bounding box localization."""
        h, w = frame.shape[:2]
        try:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            # Mask for plant green spectrum + diseased yellow/brown spectrum
            mask_green = cv2.inRange(hsv, np.array([25, 40, 40]), np.array([85, 255, 255]))
            mask_yellow = cv2.inRange(hsv, np.array([10, 40, 40]), np.array([25, 255, 255]))
            mask = cv2.bitwise_or(mask_green, mask_yellow)

            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) > (w * h * 0.02):
                    bx, by, bw, bh = cv2.boundingRect(c)
                    return int(bx), int(by), int(bw), int(bh)
        except Exception:
            pass

        # Fallback to center 60% ROI
        margin_x = int(w * 0.2)
        margin_y = int(h * 0.2)
        return margin_x, margin_y, int(w * 0.6), int(h * 0.6)

    def infer(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Executes local ONNX inference on the frame and returns full diagnostic intelligence.
        """
        if not self.is_loaded or self.session is None:
            return {
                "model": self.name,
                "status": "NOT_LOADED",
                "error": self.load_error or "Engine not initialized",
                "detected": False,
                "confidence_pct": 0.0,
                "latency_ms": 0.0,
                "timestamp": time.time()
            }

        t_start = time.perf_counter()

        # 1. Preprocess input
        tensor = self.preprocess(frame)

        # 2. Run ONNX Session
        outputs = self.session.run([self.output_name], {self.input_name: tensor})
        logits = outputs[0][0]

        # 3. Softmax probabilities
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)

        latency_ms = round((time.perf_counter() - t_start) * 1000, 2)
        self._total_inferences += 1
        self._total_latency_ms += latency_ms

        # 4. Top prediction
        pred_idx = int(np.argmax(probs))
        top_conf = round(float(probs[pred_idx] * 100.0), 2)
        raw_name = self.id2label.get(str(pred_idx), f"Class_{pred_idx}")

        # Derive crop and readable disease name
        is_healthy = "healthy" in raw_name.lower()
        crop = raw_name.split()[0] if raw_name else "Unknown Crop"
        if "Corn" in raw_name or "Maize" in raw_name:
            crop = "Corn (Maize)"
        elif "Bell Pepper" in raw_name:
            crop = "Bell Pepper"

        # 5. Top-3 predictions
        sorted_indices = np.argsort(probs)[::-1][:3]
        top_predictions = []
        for idx in sorted_indices:
            top_predictions.append({
                "class_idx": int(idx),
                "name": self.id2label.get(str(idx), f"Class_{idx}"),
                "confidence_pct": round(float(probs[idx] * 100.0), 2)
            })

        # 6. Agronomic metadata lookup
        severity = "None" if is_healthy else "Moderate"
        treatment = "No treatment required. Crop foliage is healthy."
        organic_control = "Maintain routine preventative bio-fungicide spray."
        chemical_control = "None"

        if pred_idx < len(self.disease_db):
            db_entry = self.disease_db[pred_idx]
            treatment = db_entry.get("cure", treatment)
            if "Blight" in raw_name or "Rot" in raw_name or "Rust" in raw_name:
                severity = "High"

        # 7. Confidence gating (>60% default)
        confidence_passed = top_conf >= self.confidence_threshold
        status = "CONFIRMED" if confidence_passed else "BELOW_CONFIDENCE_THRESHOLD"
        requires_manual_inspection = not confidence_passed

        # 8. Leaf ROI bounding box
        bx, by, bw, bh = self.detect_leaf_roi(frame)

        return {
            "model": self.name,
            "provider": self.execution_provider,
            "latency_ms": latency_ms,
            "confidence_pct": top_conf,
            "confidence_threshold_pct": self.confidence_threshold,
            "status": status,
            "detected": confidence_passed and not is_healthy,
            "is_healthy": is_healthy,
            "class_idx": pred_idx,
            "raw_class": raw_name,
            "disease_name": raw_name if confidence_passed else f"Uncertain ({raw_name})",
            "crop": crop,
            "severity": severity if confidence_passed else "Unknown",
            "treatment": treatment if confidence_passed else "Confidence too low for automated chemical recommendation. Collect another angle.",
            "organic_control": organic_control,
            "chemical_control": chemical_control,
            "top_predictions": top_predictions,
            "leaf_roi": [bx, by, bw, bh],
            "requires_manual_inspection": requires_manual_inspection,
            "timestamp": time.time()
        }

    def health(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "loaded": self.is_loaded,
            "execution_provider": self.execution_provider,
            "model_path": self.model_path,
            "classes_count": len(self.id2label),
            "confidence_threshold_pct": self.confidence_threshold,
            "total_inferences": self._total_inferences,
            "avg_latency_ms": round(self.get_average_latency_ms(), 2),
            "error": self.load_error
        }
