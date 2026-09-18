from typing import Dict, Any, Optional
from edge.app.sensors.base import SensorReading
from edge.app.config.settings import edge_settings

class IrrigationDecisionModel:
    """
    Local edge irrigation decision engine.
    Computes precise watering necessity based on root zone moisture,
    evaporative atmospheric demand, and tank storage safety.
    """

    def evaluate(self, sensor: SensorReading) -> Dict[str, Any]:
        if not sensor.is_valid or sensor.soil_moisture_pct is None:
            return {
                "action": "HOLD_INSPECTION_REQUIRED",
                "urgency": "LOW",
                "recommended_volume_liters_m2": 0.0,
                "pump_relay_state": "OFF",
                "reason": "Invalid or missing soil moisture telemetry"
            }

        soil_pct = sensor.soil_moisture_pct
        temp_c = sensor.temperature_c or 25.0
        tank_cm = sensor.water_tank_level_cm or 100.0

        # Safety: Tank dry-run protection
        if tank_cm < 20.0:
            return {
                "action": "ABORT_LOW_WATER_STORAGE",
                "urgency": "CRITICAL",
                "recommended_volume_liters_m2": 0.0,
                "pump_relay_state": "OFF",
                "reason": f"Water storage tank level ({tank_cm} cm) is below safety threshold (20 cm). Pump halted to prevent motor burnout."
            }

        # Temperature-adjusted evaporative multiplier
        evap_multiplier = 1.0
        if temp_c > 35.0:
            evap_multiplier = 1.35
        elif temp_c > 30.0:
            evap_multiplier = 1.15
        elif temp_c < 18.0:
            evap_multiplier = 0.85

        crit_threshold = edge_settings.decision.critical_soil_moisture_pct

        if soil_pct < crit_threshold:
            deficit_pct = max(0.0, 55.0 - soil_pct)
            vol = round((deficit_pct * 0.4) * evap_multiplier, 1)
            return {
                "action": "EMERGENCY_IRRIGATION",
                "urgency": "HIGH",
                "recommended_volume_liters_m2": vol,
                "recommended_duration_minutes": int(vol * 3.5),
                "pump_relay_state": "ON",
                "reason": f"Soil moisture ({soil_pct}%) is critically below target ({crit_threshold}%). High evaporative demand at {temp_c}°C."
            }
        elif soil_pct < 45.0:
            deficit_pct = max(0.0, 55.0 - soil_pct)
            vol = round((deficit_pct * 0.25) * evap_multiplier, 1)
            return {
                "action": "SCHEDULED_IRRIGATION",
                "urgency": "MEDIUM",
                "recommended_volume_liters_m2": vol,
                "recommended_duration_minutes": int(vol * 3.0),
                "pump_relay_state": "SCHEDULED",
                "reason": f"Soil moisture ({soil_pct}%) is in moderate depletion zone. Schedule off-peak irrigation cycle."
            }
        elif soil_pct > 80.0:
            return {
                "action": "HALT_WATERLOGGING_RISK",
                "urgency": "HIGH",
                "recommended_volume_liters_m2": 0.0,
                "pump_relay_state": "OFF",
                "reason": f"Soil moisture ({soil_pct}%) indicates saturation or poor drainage. Halt irrigation to avoid root hypoxia."
            }
        else:
            return {
                "action": "OPTIMAL_MOISTURE_MAINTAINED",
                "urgency": "LOW",
                "recommended_volume_liters_m2": 0.0,
                "pump_relay_state": "OFF",
                "reason": f"Soil moisture ({soil_pct}%) is currently within optimal range (45% - 80%)."
            }
