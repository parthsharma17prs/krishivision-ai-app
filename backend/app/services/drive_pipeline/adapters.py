"""
Pluggable Model Adapters: Interface to connect any ML model to the Google Drive pipeline.
"""

from abc import ABC, abstractmethod
import sys
import os
from typing import Any, Callable, Dict, Optional
from PIL import Image


class BaseModelAdapter(ABC):
    """Abstract base class for wrapping ML models into the Drive pipeline."""

    @abstractmethod
    def predict(self, image: Image.Image, metadata: Dict[str, Any]) -> Any:
        """
        Receives a downloaded PIL image and file metadata (file_id, filename, etc.),
        runs ML inference, and returns prediction results.
        """
        raise NotImplementedError


class CallableAdapter(BaseModelAdapter):
    """Wraps any user-defined function or callable into an adapter."""

    def __init__(self, callback: Callable[[Image.Image, Dict[str, Any]], Any]):
        self.callback = callback

    def predict(self, image: Image.Image, metadata: Dict[str, Any]) -> Any:
        try:
            # Try calling with both image and metadata
            return self.callback(image, metadata)
        except TypeError:
            # Fall back to single-argument callback(image)
            return self.callback(image)


class LogOnlyAdapter(BaseModelAdapter):
    """Default adapter that logs downloaded image info when no model is attached."""

    def predict(self, image: Image.Image, metadata: Dict[str, Any]) -> Dict[str, Any]:
        info = {
            "file_id": metadata.get("id"),
            "filename": metadata.get("name"),
            "resolution": f"{image.width}x{image.height}",
            "status": "received",
        }
        print(f"🌿 [ModelAdapter:LogOnly] Processed image {info['filename']} ({info['resolution']})")
        return info


class PlantDoctorAdapter(BaseModelAdapter):
    """
    Ready-to-use adapter for KrishiVision AI / PlantDoctor MobileNetV2 ONNX model
    from your existing project.
    """

    def __init__(self, project_path: Optional[str] = None):
        """
        Automatically locates and loads PlantDoctor from your project directory.
        """
        candidate_paths = [
            project_path,
            "/Users/macbook/Desktop/Projects/projeect_suas",
            os.path.join(os.path.dirname(__file__), "..", "..", "projeect_suas"),
        ]

        self.doctor = None
        for path in candidate_paths:
            if path and os.path.exists(path):
                backend_dir = os.path.join(path, "backend")
                ml_dir = os.path.join(path, "backend", "app", "ml")
                if backend_dir not in sys.path:
                    sys.path.insert(0, backend_dir)
                if ml_dir not in sys.path:
                    sys.path.insert(0, ml_dir)

                try:
                    from plant_doctor import PlantDoctor
                    self.doctor = PlantDoctor()
                    print(f"✅ [PlantDoctorAdapter] Successfully loaded PlantDoctor from {path}!")
                    break
                except Exception as e:
                    print(f"⚠️ [PlantDoctorAdapter] Attempt to load from {path} failed: {e}")

        if not self.doctor:
            print("⚠️ [PlantDoctorAdapter] Could not import PlantDoctor. Falling back to LogOnly mode.")

    def predict(self, image: Image.Image, metadata: Dict[str, Any]) -> Any:
        if not self.doctor:
            return LogOnlyAdapter().predict(image, metadata)

        # Support both diagnose() and predict() interfaces
        if hasattr(self.doctor, "diagnose"):
            res = self.doctor.diagnose(image, include_nutrients=False, include_pesticides=True)
        elif hasattr(self.doctor, "predict"):
            res = self.doctor.predict(image)
        else:
            raise AttributeError("PlantDoctor instance has neither 'diagnose' nor 'predict' method.")

        filename = metadata.get("name", "unknown")
        disease_name = res.get("disease_name") or res.get("disease") or "Unknown"
        confidence = res.get("confidence") or res.get("confidence_pct") or 0.0
        print(
            f"🌿 [PlantDoctor] Diagnosis for {filename}: {disease_name} "
            f"({confidence}% confidence)"
        )
        return res
