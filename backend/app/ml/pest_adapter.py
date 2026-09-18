import os
import time
import json
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
import onnxruntime as ort

class PestModelAdapter:
    """
    Production ONNX YOLOv8 Pest Detection Engine.
    Executes real-time spatial object detection for agricultural crop pests
    (Fall Armyworm Larva/Egg/Frass, Beetles, Aphids, Whiteflies).
    Includes Non-Maximum Suppression (NMS), bounding box scaling,
    Economic Thresholding (ETL/EIL), and Integrated Pest Management (IPM) directives.
    """

    PEST_CLASSES = {
        0: {"name": "Fall Armyworm Egg", "severity": "Moderate", "etl_limit": 3},
        1: {"name": "Fall Armyworm Frass", "severity": "Low", "etl_limit": 5},
        2: {"name": "Fall Armyworm Larva", "severity": "Critical", "etl_limit": 1},
        3: {"name": "Fall Armyworm Larval Damage", "severity": "High", "etl_limit": 2},
        4: {"name": "Healthy Foliage", "severity": "Optimal", "etl_limit": 99},
        5: {"name": "Maize Streak Virus Vector", "severity": "High", "etl_limit": 1}
    }

    IPM_KNOWLEDGE_BASE = {
        "Fall Armyworm Larva": {
            "biological": [
                "Release Trichogramma chilonis egg parasitoids @ 50,000/acre at first moth sighting.",
                "Apply Bacillus thuringiensis (Bt) var. kurstaki @ 2 g/L or Metarhizium anisopliae @ 5 g/L."
            ],
            "cultural": [
                "Install funnel-type pheromone traps @ 5 traps/acre for adult male moth monitoring.",
                "Apply clean river sand or ash mixed with lime into leaf whorls to disrupt larval feeding."
            ],
            "chemical": [
                "Early Instar (1st-2nd): Spray Emamectin Benzoate 5% SG @ 0.4 g/L (Withholding period: 14 days).",
                "Late Instar (3rd-4th): Spray Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Spinetoram 11.7% SC @ 0.5 ml/L."
            ]
        },
        "Fall Armyworm Egg": {
            "biological": ["Deploy Telenomus remus parasitoid wasps to destroy egg masses."],
            "cultural": ["Crush yellow/hairy egg masses manually during early morning field scouting."],
            "chemical": ["Foliar neem oil spray (Azadirachtin 10,000 ppm) @ 3 ml/L to inhibit egg hatching."]
        },
        "Fall Armyworm Larval Damage": {
            "biological": ["Apply Entomopathogenic Nematodes (Steinernema carpocapsae) into whorls."],
            "cultural": ["Intercrop maize with desmodium (push-pull strategy) and border with Napier grass."],
            "chemical": ["Target whorl application of Spinetoram 11.7% SC @ 0.5 ml/L during cool evening hours."]
        },
        "Beetle": {
            "biological": ["Encourage natural predators like ground beetles, lacewings, and assassin bugs."],
            "cultural": ["Use yellow sticky traps @ 10 traps/acre; apply kaolin clay reflective spray."],
            "chemical": ["Apply Neem-based EC formulation @ 5 ml/L or Imidacloprid 17.8% SL @ 0.3 ml/L if threshold exceeded."]
        }
    }

    def __init__(self, model_path: Optional[str] = None):
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        self.model_path = model_path or os.path.join(root_dir, "models", "pest_yolov8.onnx")
        self.session: Optional[ort.InferenceSession] = None
        self.is_loaded = False
        self.mode = "REAL_MODEL"
        self.load_error: Optional[str] = None

        self.load()

    def load(self) -> bool:
        if not os.path.exists(self.model_path):
            self.is_loaded = False
            self.load_error = f"Pest model weights not found at {self.model_path}"
            self.mode = "DEMO"
            return False

        try:
            opts = ort.SessionOptions()
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            self.session = ort.InferenceSession(self.model_path, sess_options=opts, providers=["CPUExecutionProvider"])
            self.is_loaded = True
            self.mode = "REAL_MODEL (YOLOv8 ONNX)"
            self.load_error = None
            return True
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            self.mode = "DEMO"
            return False

    def health(self) -> Dict[str, Any]:
        return {
            "model_key": "pest",
            "loaded": self.is_loaded,
            "mode": self.mode,
            "architecture": "YOLOv8 Agricultural Pest Object Detector",
            "model_path": self.model_path,
            "error": self.load_error
        }

    def metadata(self) -> Dict[str, Any]:
        return {
            "supported_pests": [v["name"] for v in self.PEST_CLASSES.values()],
            "classes_count": len(self.PEST_CLASSES),
            "input_resolution": "640x640"
        }

    def _letterbox(self, img: np.ndarray, target_shape=(640, 640)) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        h, w = img.shape[:2]
        scale = min(target_shape[0] / h, target_shape[1] / w)
        nw, nh = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)

        canvas = np.full((target_shape[0], target_shape[1], 3), 114, dtype=np.uint8)
        dx = (target_shape[1] - nw) // 2
        dy = (target_shape[0] - nh) // 2
        canvas[dy:dy + nh, dx:dx + nw] = resized
        return canvas, scale, (dx, dy)

    def predict_image(
        self,
        image_path: str,
        output_dir: Optional[str] = None,
        conf_threshold: float = 0.20,
        nms_threshold: float = 0.45
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Input image not found: {image_path}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not decode image at {image_path}")

        orig_h, orig_w = img.shape[:2]

        if not self.is_loaded or self.session is None:
            # Fallback for unexpected missing model
            return self._demo_fallback(orig_w, orig_h)

        # 1. Letterbox Preprocessing
        canvas, scale, (dx, dy) = self._letterbox(img)
        rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
        tensor = (rgb.astype(np.float32) / 255.0).transpose((2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)

        # 2. Run ONNX Inference
        outputs = self.session.run(None, {self.session.get_inputs()[0].name: tensor})
        raw_output = outputs[0][0]  # Shape: (num_attrs, 8400) e.g., (10, 8400)
        preds = raw_output.T       # Shape: (8400, 10)

        boxes = []
        scores = []
        class_ids = []

        for row in preds:
            cx, cy, bw, bh = row[:4]
            cl_scores = row[4:]
            cid = int(np.argmax(cl_scores))
            c_score = float(cl_scores[cid])

            # Filter non-pest / low confidence background
            if cid == 4 and c_score > 0.5:  # Healthy maize
                continue

            if c_score >= conf_threshold:
                # Convert back to original image space
                x1 = max(0, int((cx - bw / 2.0 - dx) / scale))
                y1 = max(0, int((cy - bh / 2.0 - dy) / scale))
                w_box = min(orig_w - x1, int(bw / scale))
                h_box = min(orig_h - y1, int(bh / scale))

                boxes.append([x1, y1, w_box, h_box])
                scores.append(c_score)
                class_ids.append(cid)

        # 3. Non-Maximum Suppression (NMS)
        indices = cv2.dnn.NMSBoxes(boxes, scores, conf_threshold, nms_threshold)

        detected_pests = []
        annotated_img = img.copy()

        if len(indices) > 0:
            flat_indices = indices.flatten() if hasattr(indices, 'flatten') else [i[0] for i in indices]
            for i in flat_indices:
                bx, by, bw_b, bh_b = boxes[i]
                cid = class_ids[i]
                conf_pct = round(scores[i] * 100.0, 1)

                p_info = self.PEST_CLASSES.get(cid, {"name": f"Pest Class {cid}", "severity": "Moderate"})
                p_name = p_info["name"]

                detected_pests.append({
                    "pest_name": p_name,
                    "class_id": cid,
                    "confidence_pct": conf_pct,
                    "severity": p_info["severity"],
                    "bounding_box": [bx, by, bw_b, bh_b]
                })

                # Draw high-contrast bounding box on annotated image
                color = (0, 0, 255) if p_info["severity"] in ["Critical", "High"] else (0, 215, 255)
                cv2.rectangle(annotated_img, (bx, by), (bx + bw_b, by + bh_b), color, 3)
                label = f"{p_name} ({conf_pct}%)"
                cv2.rectangle(annotated_img, (bx, max(0, by - 25)), (bx + len(label) * 9 + 10, by), color, -1)
                cv2.putText(annotated_img, label, (bx + 5, max(15, by - 7)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        # 4. Save Annotated Output Image if output_dir specified
        annotated_relative_url = ""
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            filename = f"pest_annotated_{int(time.time())}_{os.path.basename(image_path)}"
            save_path = os.path.join(output_dir, filename)
            cv2.imwrite(save_path, annotated_img)
            annotated_relative_url = f"/uploads/pest_scans/{filename}"

        # 5. Economic Injury Level (EIL) & IPM Recommendation Synthesis
        pest_count = len(detected_pests)
        overall_severity = "Low / None"
        etl_status = "BELOW_ECONOMIC_THRESHOLD"

        if pest_count == 1:
            overall_severity = "Moderate"
            etl_status = "APPROACHING_ECONOMIC_THRESHOLD"
        elif pest_count >= 2:
            overall_severity = "Critical (Action Required)"
            etl_status = "EXCEEDING_ECONOMIC_THRESHOLD_IMMEDIATE_INTERVENTION"

        # Harvest IPM controls
        bio_controls: List[str] = []
        cult_controls: List[str] = []
        chem_controls: List[str] = []

        if detected_pests:
            for p in detected_pests:
                pname = p["pest_name"]
                ipm = self.IPM_KNOWLEDGE_BASE.get(pname, self.IPM_KNOWLEDGE_BASE["Fall Armyworm Larva"])
                bio_controls.extend(ipm.get("biological", []))
                cult_controls.extend(ipm.get("cultural", []))
                chem_controls.extend(ipm.get("chemical", []))
        else:
            bio_controls.append("Maintain natural bio-control agents (spiders, predatory mites, ground beetles).")
            cult_controls.append("Deploy yellow sticky traps @ 5 traps/acre for baseline field scouting.")
            chem_controls.append("No chemical intervention required. Crop canopy pest-free.")

        processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

        return {
            "pest_count": pest_count,
            "overall_severity": overall_severity,
            "economic_threshold_status": etl_status,
            "detected_pests": detected_pests,
            "ipm_recommendations": {
                "biological": list(set(bio_controls)),
                "cultural_mechanical": list(set(cult_controls)),
                "chemical": list(set(chem_controls))
            },
            "recommended_control": list(set(bio_controls + cult_controls + chem_controls)),
            "annotated_image_url": annotated_relative_url,
            "mode": self.mode,
            "processing_time_ms": processing_time_ms
        }

    def _demo_fallback(self, w: int, h: int) -> Dict[str, Any]:
        return {
            "pest_count": 1,
            "overall_severity": "Moderate",
            "economic_threshold_status": "APPROACHING_ECONOMIC_THRESHOLD",
            "detected_pests": [
                {
                    "pest_name": "Tomato Fruit Borer (Helicoverpa armigera)",
                    "class_id": 2,
                    "confidence_pct": 87.5,
                    "severity": "High",
                    "bounding_box": [int(w * 0.2), int(h * 0.25), int(w * 0.4), int(h * 0.4)]
                }
            ],
            "ipm_recommendations": {
                "biological": ["Release Trichogramma chilonis egg parasitoids @ 50,000/acre."],
                "cultural_mechanical": ["Install funnel-type pheromone traps @ 5 traps/acre."],
                "chemical": ["Spray Emamectin Benzoate 5% SG @ 0.4 g/L."]
            },
            "recommended_control": [
                "Install funnel-type pheromone traps @ 5 traps/acre.",
                "Spray Emamectin Benzoate 5% SG @ 0.4 g/L."
            ],
            "annotated_image_url": "",
            "mode": "DEMO",
            "processing_time_ms": 12.0
        }

pest_adapter = PestModelAdapter()
