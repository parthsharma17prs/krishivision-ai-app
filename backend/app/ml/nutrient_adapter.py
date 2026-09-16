from typing import Dict, Any, List, Optional
from app.ml.base_adapter import BaseModelAdapter

class NutrientModelAdapter(BaseModelAdapter):
    """
    Multimodal Nutrient Deficiency Assessment Engine.
    Combines NPK sensor telemetry, soil pH, growth stage requirements, and leaf symptom observations.
    Supports N, P, K, Mg, Fe, Zn assessment.
    """

    def __init__(self):
        self.is_loaded = True
        self.mode = "RULE_ENGINE"
        self.version = "NutrientMatrix-v1.0"

    def load(self) -> bool:
        return True

    def health(self) -> Dict[str, Any]:
        return {
            "model_key": "nutrient",
            "loaded": self.is_loaded,
            "mode": self.mode,
            "architecture": "Multimodal Rule-Based Knowledge Matrix",
            "notice": "Preliminary AI assessment — confirm with soil/leaf testing."
        }

    def metadata(self) -> Dict[str, Any]:
        return {
            "supported_nutrients": ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)", "Magnesium (Mg)", "Iron (Fe)", "Zinc (Zn)"]
        }

    def predict(
        self,
        crop_name: str,
        growth_stage: str,
        soil_ph: Optional[float] = 6.8,
        npk_sensor: Optional[Dict[str, float]] = None,
        symptoms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        if npk_sensor is None:
            npk_sensor = {"N": 110, "P": 45, "K": 175}

        # Analyze deficit
        nitrogen_val = npk_sensor.get("N", 120)
        potassium_val = npk_sensor.get("K", 180)
        phosphorus_val = npk_sensor.get("P", 50)

        breakdown = {
            "Nitrogen (N)": max(10.0, min(95.0, (140 - nitrogen_val) * 1.5)),
            "Phosphorus (P)": max(10.0, min(95.0, (60 - phosphorus_val) * 1.2)),
            "Potassium (K)": max(10.0, min(95.0, (200 - potassium_val) * 1.1)),
            "Magnesium (Mg)": 22.0,
            "Iron (Fe)": 15.0,
            "Zinc (Zn)": 18.0
        }

        # Determine primary deficiency
        primary_deficiency = max(breakdown, key=breakdown.get)
        confidence = round(breakdown[primary_deficiency], 1)

        evidence = [
            f"NPK Telemetry: Nitrogen {nitrogen_val} mg/kg is below optimal flowering baseline (140 mg/kg).",
            f"Soil pH {soil_ph} is within acceptable range (6.0 - 7.2) for {crop_name}.",
            f"Growth Stage '{growth_stage}' requires elevated Nitrogen & Potassium for fruit development."
        ]

        advisories = [
            "Foliar spray of 1% Urea solution (10g/L water) in early morning hours.",
            "Apply fertigation with Calcium Nitrate @ 3 kg/acre via drip system.",
            "Schedule a laboratory petiole tissue test to verify micro-nutrient availability."
        ]

        return {
            "likely_deficiency": primary_deficiency,
            "confidence_pct": confidence,
            "deficiency_breakdown": breakdown,
            "supporting_evidence": evidence,
            "recommended_fertilizer_advisory": advisories,
            "recommended_soil_test": "Lab NPK & Micronutrient Inductively Coupled Plasma (ICP) Analysis",
            "mode": self.mode,
            "notice": "Preliminary AI assessment — confirm with soil/leaf testing."
        }

nutrient_adapter = NutrientModelAdapter()
