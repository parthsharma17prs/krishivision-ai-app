import uuid
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from edge.app.sensors.base import SensorReading
from edge.app.decision.irrigation import IrrigationDecisionModel
from edge.app.decision.risks import ClimateRiskEngine
from edge.app.decision.nutrient import MultimodalNutrientEngine

class FarmDecision(BaseModel):
    decision_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
    field_id: str = "field-indore-1"
    farm_id: str = "farm-indore-001"
    primary_action: str
    urgency: str
    summary_headline: str
    action_items: List[str]
    evidence_codes: List[str]
    irrigation: Dict[str, Any]
    climate: Dict[str, Any]
    nutrients: Dict[str, Any]
    disease: Dict[str, Any]
    pest: Dict[str, Any]
    telemetry_snapshot: Dict[str, Any]
    local_only: bool = True
    cloud_synced: bool = False

class EdgeDecisionEngine:
    """
    Unified On-Device Autonomous Decision Engine.
    Correlates real-time visual AI pathology with edge microclimate sensors
    to synthesize prioritized farm interventions without cloud dependency.
    """

    def __init__(self, field_id: str = "field-indore-1", farm_id: str = "farm-indore-001"):
        self.field_id = field_id
        self.farm_id = farm_id
        self.irrigation_model = IrrigationDecisionModel()
        self.climate_risk_engine = ClimateRiskEngine()
        self.nutrient_engine = MultimodalNutrientEngine()
        self.last_decision: Optional[FarmDecision] = None

    def evaluate(
        self,
        sensor: SensorReading,
        disease_res: Dict[str, Any],
        pest_res: Optional[Dict[str, Any]] = None
    ) -> FarmDecision:
        pest_res = pest_res or {"available": False, "detections": []}

        # Sub-engine evaluations
        irrig = self.irrigation_model.evaluate(sensor)
        climate = self.climate_risk_engine.evaluate(sensor, disease_res)
        nutrients = self.nutrient_engine.evaluate(sensor, disease_res)

        evidence_codes: List[str] = []
        action_items: List[str] = []

        # 1. Harvest evidence codes
        if sensor.soil_moisture_pct is not None:
            if sensor.soil_moisture_pct < 25.0:
                evidence_codes.append(f"CRIT_SOIL_MOISTURE_{sensor.soil_moisture_pct}%")
            elif sensor.soil_moisture_pct > 85.0:
                evidence_codes.append(f"EXCESS_SOIL_MOISTURE_{sensor.soil_moisture_pct}%")

        if sensor.temperature_c and sensor.temperature_c >= 38.0:
            evidence_codes.append(f"HEAT_STRESS_{sensor.temperature_c}C")

        if disease_res.get("detected", False) and disease_res.get("status") == "CONFIRMED":
            d_name = disease_res.get("disease_name", "Unknown Disease")
            d_conf = disease_res.get("confidence_pct", 0.0)
            evidence_codes.append(f"LEAF_PATHOLOGY_{d_name.replace(' ', '_').upper()}_CONF_{d_conf}%")

        if pest_res.get("detections"):
            count = len(pest_res["detections"])
            evidence_codes.append(f"PEST_INFESTATION_{count}_ORGANISMS")

        primary_threat = climate.get("primary_threat")
        overall_threat = climate.get("overall_threat_level")
        if overall_threat in ["HIGH", "CRITICAL"]:
            evidence_codes.append(f"CLIMATE_{primary_threat}_{overall_threat}")

        # 2. Priority Arbitrator
        # Urgency ladder: CRITICAL -> HIGH -> MEDIUM -> LOW
        primary_action = "OPTIMAL_GROWTH_MONITORING"
        urgency = "LOW"
        headline = "Field Conditions Optimal — All Parameters Within Target Agronomic Windows"

        # Case 1: Extreme dry soil / drought emergency
        if irrig["urgency"] == "CRITICAL" and "LOW_WATER" in irrig["action"]:
            primary_action = "CRITICAL_STORAGE_DEPLETION_ALERT"
            urgency = "CRITICAL"
            headline = "Water Storage Empty — Irrigation Halted to Protect Pumps"
            action_items.append("Refill primary water storage reservoir immediately.")
            action_items.append("Inspect drip irrigation lines for airlocks or leaks.")

        elif irrig["action"] == "EMERGENCY_IRRIGATION":
            primary_action = "EMERGENCY_DRIP_IRRIGATION"
            urgency = "HIGH"
            headline = f"Root Zone Critically Dry ({sensor.soil_moisture_pct}%) — Drip Pulse Initiated"
            action_items.append(f"Deliver {irrig.get('recommended_volume_liters_m2', 12.0)} L/m² of water via drip lines.")
            action_items.append(f"Run irrigation pump for {irrig.get('recommended_duration_minutes', 40)} minutes.")

        # Case 2: Waterlogging / Flood
        elif climate.get("primary_threat") == "WATERLOGGING_FLOOD" and overall_threat in ["HIGH", "CRITICAL"]:
            primary_action = "EMERGENCY_FLOOD_DRAINAGE"
            urgency = "HIGH"
            headline = f"Excess Soil Saturation ({sensor.soil_moisture_pct}%) — Open Trench Drainage"
            action_items.append("Open field drainage valves to prevent root suffocation.")
            action_items.append("Suspend all automated irrigation cycles until moisture drops below 75%.")

        # Case 3: Confirmed Disease Outbreak
        elif disease_res.get("detected", False) and disease_res.get("status") == "CONFIRMED":
            primary_action = "FUNGICIDE_TREATMENT_DISPATCH"
            urgency = "HIGH" if disease_res.get("severity") == "High" else "MEDIUM"
            d_name = disease_res.get("disease_name")
            headline = f"Confirmed Foliar Infection: {d_name} ({disease_res.get('confidence_pct')}%)"
            action_items.append(f"Treatment: {disease_res.get('treatment')}")
            action_items.append(f"Organic control: {disease_res.get('organic_control')}")
            if climate.get("primary_threat") == "FUNGAL_MICROCLIMATE":
                action_items.append("Atmospheric humidity exceeds 85% — apply fungicide within 4 hours before spore spread.")

        # Case 4: Heat Wave
        elif climate.get("primary_threat") == "HEAT_WAVE_STRESS" and overall_threat in ["HIGH", "CRITICAL"]:
            primary_action = "HEATWAVE_CANOPY_COOLING"
            urgency = "HIGH"
            headline = f"Heat Wave Alert ({sensor.temperature_c}°C) — Activate Canopy Shade & Micro-Mist"
            action_items.append("Deploy shade net canopies or misting sprinklers to drop ambient canopy temperature by 3-5°C.")
            action_items.append("Irrigate in evening or pre-dawn to minimize evaporative loss.")

        # Case 5: Routine Irrigation
        elif irrig["action"] == "SCHEDULED_IRRIGATION":
            primary_action = "SCHEDULED_IRRIGATION_CYCLE"
            urgency = "MEDIUM"
            headline = f"Moisture Depletion Noted ({sensor.soil_moisture_pct}%) — Scheduled Cycle Pending"
            action_items.append(f"Apply {irrig.get('recommended_volume_liters_m2', 6.0)} L/m² in next scheduled cycle.")

        # Default: Maintenance
        if not action_items:
            action_items.append("Continue regular autonomous sensor telemetry polling and visual canopy inspection.")
            action_items.append("Soil and microclimate conditions are currently balanced for optimal photosynthetic efficiency.")

        telemetry_snap = {
            "temperature_c": sensor.temperature_c,
            "humidity_pct": sensor.humidity_pct,
            "soil_moisture_pct": sensor.soil_moisture_pct,
            "water_tank_level_cm": sensor.water_tank_level_cm,
            "sensor_source": sensor.source,
            "sensor_valid": sensor.is_valid
        }

        decision = FarmDecision(
            field_id=self.field_id,
            farm_id=self.farm_id,
            primary_action=primary_action,
            urgency=urgency,
            summary_headline=headline,
            action_items=action_items,
            evidence_codes=evidence_codes,
            irrigation=irrig,
            climate=climate,
            nutrients=nutrients,
            disease=disease_res,
            pest=pest_res,
            telemetry_snapshot=telemetry_snap,
            local_only=True,
            cloud_synced=False
        )

        self.last_decision = decision
        return decision
