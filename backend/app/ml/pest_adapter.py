import time
from typing import Dict, Any, List
from app.ml.base_adapter import BaseModelAdapter

class PestModelAdapter(BaseModelAdapter):
    """
    Modular Pest Detection Adapter.
    Exposes an adapter interface for YOLO pest detectors (e.g., Helicoverpa armigera, Spodoptera litura, Whitefly).
    Supports transparent DEMO mode fallback with explicit UI notice.
    """

    def __init__(self):
        self.is_loaded = True
        self.mode = "DEMO"
        self.model_version = "YOLOv8-Pest-Demo"

    def load(self) -> bool:
        return True

    def health(self) -> Dict[str, Any]:
        return {
            "model_key": "pest",
            "loaded": self.is_loaded,
            "mode": self.mode,
            "architecture": "YOLO Pest Detector (Adapter Interface)",
            "notice": "Demo inference — replace with trained pest model for field deployment."
        }

    def metadata(self) -> Dict[str, Any]:
        return {
            "supported_pests": ["Tomato Fruit Borer (Helicoverpa armigera)", "Whitefly (Bemisia tabaci)", "Aphids"],
            "classes_count": 3
        }

    def predict(self, crop_name: str = "Tomato") -> Dict[str, Any]:
        start_time = time.time()
        
        detected = [
            {
                "pest_name": "Tomato Fruit Borer (Helicoverpa armigera)",
                "confidence_pct": 87.5,
                "bounding_box": [0.22, 0.31, 0.54, 0.68]
            }
        ]

        controls = [
            "Install pheromone traps (5 traps per acre) for monitoring adult moth populations.",
            "Apply Azadirachtin 10,000 ppm (Neem oil) @ 2 ml/L during early instar stage.",
            "Release Trichogramma chilonis egg parasitoids @ 50,000/acre if infestation rises."
        ]

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "detected_pests": detected,
            "overall_severity": "Moderate",
            "recommended_control": controls,
            "mode": self.mode,
            "label_notice": "Demo inference — replace with trained pest model for field deployment.",
            "processing_time_ms": processing_time
        }

pest_adapter = PestModelAdapter()
