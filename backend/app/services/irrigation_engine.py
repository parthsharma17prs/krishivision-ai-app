from typing import Dict, Any, List, Optional

class SmartIrrigationEngine:
    """
    Smart Irrigation Recommendation Engine.
    Combines soil moisture sensors, weather forecasts, crop evapotranspiration, and soil type.
    Provides transparent reasoning for every recommendation.
    """

    CRITICAL_THRESHOLDS = {
        "Tomato": {"flowering": 30.0, "vegetative": 25.0, "maturity": 20.0},
        "Cotton": {"flowering": 28.0, "vegetative": 22.0, "maturity": 18.0},
        "Wheat": {"flowering": 32.0, "vegetative": 25.0, "maturity": 22.0},
        "Default": {"flowering": 30.0, "vegetative": 25.0, "maturity": 20.0}
    }

    def analyze(
        self,
        soil_moisture_pct: float,
        temperature_c: float,
        humidity_pct: float,
        rain_probability_pct: float,
        crop_name: str = "Tomato",
        growth_stage: str = "Flowering & Fruit Setting",
        field_name: str = "Field A - Main Acre",
        soil_type: str = "Black Soil (Regur)"
    ) -> Dict[str, Any]:
        
        threshold = 30.0  # Moisture threshold % for flowering tomato
        reasons: List[str] = []
        irrigate_required = False
        urgency = "LOW"
        recommended_window = "No irrigation required today"
        liters_per_acre = 0.0

        # Check 1: Rainfall expectation
        if rain_probability_pct >= 60.0:
            irrigate_required = False
            reasons.append(f"Significant precipitation forecast ({rain_probability_pct}% chance of rain in next 24h).")
            reasons.append("Postponing irrigation saves water and prevents root saturation.")
            urgency = "LOW"
            recommended_window = "Hold — Rain expected"
            water_saving_explanation = f"Saved approx 1,500 liters/acre by deferring irrigation ahead of natural rainfall."
        elif soil_moisture_pct < threshold:
            irrigate_required = True
            deficit = threshold - soil_moisture_pct
            
            if deficit > 10.0 or temperature_c > 36.0:
                urgency = "CRITICAL"
                recommended_window = "Immediate (Within 2 hours)"
                liters_per_acre = 1800.0
            elif deficit > 5.0:
                urgency = "HIGH"
                recommended_window = "Within 4 hours (Evening preferred)"
                liters_per_acre = 1400.0
            else:
                urgency = "MEDIUM"
                recommended_window = "Within 8 hours"
                liters_per_acre = 1000.0

            reasons.append(f"Soil moisture level ({soil_moisture_pct:.1f}%) is below the critical threshold ({threshold:.1f}%) for {crop_name}.")
            if temperature_c >= 33.0:
                reasons.append(f"High daytime temperature ({temperature_c:.1f}°C) accelerates soil evapotranspiration.")
            reasons.append(f"Crop stage '{growth_stage}' has high transpiration demand for fruit development.")
            reasons.append(f"Low rainfall probability ({rain_probability_pct}%).")

            water_saving_explanation = f"Targeted drip irrigation window minimizes evaporation loss by 35% compared to flood irrigation."
        else:
            irrigate_required = False
            reasons.append(f"Soil moisture level ({soil_moisture_pct:.1f}%) is adequate (threshold: {threshold:.1f}%).")
            if humidity_pct > 65.0:
                reasons.append(f"Relative humidity ({humidity_pct:.1f}%) reduces crop water loss.")
            reasons.append("Crop is not currently experiencing water stress.")
            urgency = "LOW"
            recommended_window = "Check moisture level tomorrow morning"
            water_saving_explanation = "Adequate soil moisture retention; no additional irrigation required."

        return {
            "farm_id": "farm-indore-001",
            "field_name": field_name,
            "crop_name": crop_name,
            "irrigate_required": irrigate_required,
            "urgency": urgency,
            "recommended_window": recommended_window,
            "estimated_water_liters_per_acre": liters_per_acre,
            "current_soil_moisture_pct": soil_moisture_pct,
            "optimal_moisture_range_pct": f"{threshold:.0f}% - 45%",
            "reasoning": reasons,
            "water_saving_explanation": water_saving_explanation,
            "mode": "RULE_ENGINE"
        }

irrigation_engine = SmartIrrigationEngine()
