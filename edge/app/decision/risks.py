from typing import Dict, Any, List
from edge.app.sensors.base import SensorReading

class ClimateRiskEngine:
    """
    Evaluates agricultural climate risks tailored to Indian farming conditions:
    1. Drought Stress
    2. Waterlogging / Flash Flood Risk
    3. Heat Wave Stomatal Stress
    4. Fungal Outbreak Microclimate Risk
    """

    def evaluate(self, sensor: SensorReading, visual_disease: Dict[str, Any]) -> Dict[str, Any]:
        temp = sensor.temperature_c or 28.0
        hum = sensor.humidity_pct or 60.0
        moist = sensor.soil_moisture_pct or 50.0

        risks: List[Dict[str, Any]] = []

        # 1. Drought Stress Assessment
        drought_score = 0.0
        if moist < 20.0:
            drought_score += 50.0
        elif moist < 30.0:
            drought_score += 30.0

        if temp > 36.0:
            drought_score += 30.0
        elif temp > 32.0:
            drought_score += 15.0

        if hum < 30.0:
            drought_score += 20.0

        drought_level = "LOW"
        if drought_score >= 70.0:
            drought_level = "CRITICAL"
        elif drought_score >= 45.0:
            drought_level = "HIGH"
        elif drought_score >= 25.0:
            drought_level = "MODERATE"

        risks.append({
            "type": "DROUGHT_STRESS",
            "score": round(drought_score, 1),
            "level": drought_level,
            "advisory": (
                "Deploy drip irrigation during cool morning hours. Apply straw mulching to suppress soil evaporation."
                if drought_level in ["HIGH", "CRITICAL"] else "Soil hydration adequate."
            )
        })

        # 2. Waterlogging / Flood Risk
        flood_score = 0.0
        if moist > 90.0:
            flood_score += 60.0
        elif moist > 80.0:
            flood_score += 35.0

        if hum > 85.0:
            flood_score += 25.0

        if sensor.water_tank_level_cm and sensor.water_tank_level_cm > 180.0:
            flood_score += 15.0

        flood_level = "LOW"
        if flood_score >= 70.0:
            flood_level = "CRITICAL"
        elif flood_score >= 45.0:
            flood_level = "HIGH"
        elif flood_score >= 25.0:
            flood_level = "MODERATE"

        risks.append({
            "type": "WATERLOGGING_FLOOD",
            "score": round(flood_score, 1),
            "level": flood_level,
            "advisory": (
                "Open trench perimeter drains to prevent root rot and anaerobic root suffocation. Cease all watering."
                if flood_level in ["HIGH", "CRITICAL"] else "Soil aeration normal."
            )
        })

        # 3. Heat Wave Stress
        heat_score = 0.0
        if temp >= 42.0:
            heat_score = 95.0
            heat_level = "CRITICAL"
        elif temp >= 38.0:
            heat_score = 75.0
            heat_level = "HIGH"
        elif temp >= 35.0:
            heat_score = 45.0
            heat_level = "MODERATE"
        else:
            heat_score = 10.0
            heat_level = "LOW"

        risks.append({
            "type": "HEAT_WAVE_STRESS",
            "score": heat_score,
            "level": heat_level,
            "advisory": (
                "Extreme heat danger: stomata will close and pollen viability drops. Mist micro-sprinklers for canopy cooling."
                if heat_level in ["HIGH", "CRITICAL"] else "Temperature within physiological tolerance."
            )
        })

        # 4. Fungal Outbreak Risk
        fungal_score = 0.0
        if hum > 85.0:
            fungal_score += 40.0
        elif hum > 75.0:
            fungal_score += 20.0

        if 20.0 <= temp <= 30.0:
            fungal_score += 35.0  # Prime spore germination thermal band

        # Correlate with active disease vision detection
        is_disease_detected = visual_disease.get("detected", False)
        disease_name = visual_disease.get("disease_name", "")
        if is_disease_detected and ("blight" in disease_name.lower() or "rot" in disease_name.lower() or "rust" in disease_name.lower() or "mildew" in disease_name.lower()):
            fungal_score += 25.0

        fungal_score = min(100.0, fungal_score)
        fungal_level = "LOW"
        if fungal_score >= 70.0:
            fungal_level = "CRITICAL"
        elif fungal_score >= 50.0:
            fungal_level = "HIGH"
        elif fungal_score >= 30.0:
            fungal_level = "MODERATE"

        risks.append({
            "type": "FUNGAL_MICROCLIMATE",
            "score": round(fungal_score, 1),
            "level": fungal_level,
            "advisory": (
                "Microclimate strongly favors fungal sporulation. Avoid overhead sprinkler irrigation; apply preventative copper/mancozeb fungicide."
                if fungal_level in ["HIGH", "CRITICAL"] else "Microclimate conditions unfavorable for rapid fungal proliferation."
            )
        })

        # Overall Climate Threat Assessment
        highest_risk = max(risks, key=lambda r: r["score"])
        return {
            "overall_threat_level": highest_risk["level"],
            "primary_threat": highest_risk["type"],
            "evaluations": risks
        }
