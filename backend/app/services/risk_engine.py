from datetime import datetime, timezone
from typing import Dict, Any, List

class RiskAssessmentService:
    """
    Agricultural Risk Assessment Engine.
    Evaluates environmental telemetry, weather trends, and crop vulnerability to forecast risk factors.
    Risks: Drought, Flood/Waterlogging, Heat Wave, Cold Snap, Water Stress, Disease Outbreak, Pest Outbreak.
    """

    def analyze(
        self,
        soil_moisture_pct: float = 28.0,
        temperature_c: float = 34.0,
        rain_probability_pct: float = 15.0,
        crop_name: str = "Tomato",
        recent_scans_count: int = 3
    ) -> Dict[str, Any]:

        active_risks: List[Dict[str, Any]] = []

        # 1. Heat Wave Risk
        if temperature_c >= 35.0:
            active_risks.append({
                "risk_type": "Heat Wave",
                "risk_level": "HIGH",
                "score_pct": 78.0,
                "title": "Heat Stress Warning",
                "description": f"Ambient temperature ({temperature_c:.1f}°C) exceeds thermal optimum for {crop_name}.",
                "mitigation_steps": [
                    "Schedule light irrigation during peak heat hours (12 PM - 3 PM) to induce evaporative cooling.",
                    "Apply shade netting over high-value nursery beds where applicable."
                ]
            })
        elif temperature_c >= 32.0:
            active_risks.append({
                "risk_type": "Heat Wave",
                "risk_level": "MEDIUM",
                "score_pct": 52.0,
                "title": "Elevated Temperature Alert",
                "description": f"Daytime temperatures reaching {temperature_c:.1f}°C.",
                "mitigation_steps": [
                    "Ensure adequate soil moisture retention through organic mulching."
                ]
            })
        else:
            active_risks.append({
                "risk_type": "Heat Wave",
                "risk_level": "LOW",
                "score_pct": 15.0,
                "title": "Thermal Conditions Normal",
                "description": f"Temperature ({temperature_c:.1f}°C) within normal growth bounds.",
                "mitigation_steps": []
            })

        # 2. Disease Outbreak Risk
        if recent_scans_count > 0:
            active_risks.append({
                "risk_type": "Disease Outbreak",
                "risk_level": "MEDIUM" if recent_scans_count < 5 else "HIGH",
                "score_pct": 65.0,
                "title": "Fungal Spore Proliferation Alert",
                "description": "High micro-climate humidity paired with warm temperature increases Early Blight spore germination.",
                "mitigation_steps": [
                    "Prune affected lower leaves immediately.",
                    "Apply prophylactic bio-fungicide (Trichoderma viride @ 5g/L)."
                ]
            })
        else:
            active_risks.append({
                "risk_type": "Disease Outbreak",
                "risk_level": "LOW",
                "score_pct": 20.0,
                "title": "Low Disease Pressure",
                "description": "No active pathogen vectors detected in recent field scans.",
                "mitigation_steps": []
            })

        # 3. Water Stress / Drought Risk
        if soil_moisture_pct < 25.0 and rain_probability_pct < 30.0:
            active_risks.append({
                "risk_type": "Water Stress & Drought",
                "risk_level": "HIGH",
                "score_pct": 82.0,
                "title": "Severe Water Stress Impending",
                "description": f"Soil moisture depleted to {soil_moisture_pct:.1f}% with low rainfall expectation ({rain_probability_pct}%).",
                "mitigation_steps": [
                    "Execute immediate drip irrigation cycle (1,400 L/acre).",
                    "Check drip emitters for clogging."
                ]
            })
        else:
            active_risks.append({
                "risk_type": "Water Stress & Drought",
                "risk_level": "LOW",
                "score_pct": 18.0,
                "title": "Adequate Moisture Buffer",
                "description": f"Soil moisture reserves ({soil_moisture_pct:.1f}%) are sufficient.",
                "mitigation_steps": []
            })

        # Determine overall farm risk level
        levels = [r["risk_level"] for r in active_risks]
        if "CRITICAL" in levels:
            overall = "CRITICAL"
        elif "HIGH" in levels:
            overall = "HIGH"
        elif "MEDIUM" in levels:
            overall = "MEDIUM"
        else:
            overall = "LOW"

        return {
            "farm_id": "farm-indore-001",
            "overall_farm_risk_level": overall,
            "assessment_date": datetime.now(timezone.utc),
            "active_risks": active_risks,
            "mode": "RULE_ENGINE",
            "disclaimer": "Risk assessment based on weather telemetry and environmental thresholds."
        }

risk_engine = RiskAssessmentService()
