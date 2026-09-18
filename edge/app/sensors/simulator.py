import time
import math
from typing import Dict, Any, Optional
from edge.app.sensors.base import BaseSensorProvider, SensorReading

class PhysicalSensorSimulator(BaseSensorProvider):
    """
    Physical sensor simulator with realistic diurnal temperature cycle,
    soil moisture evapotranspiration decay, and preset risk scenario injection.
    """

    SCENARIOS = {
        "OPTIMAL": {
            "temperature_c": 26.5,
            "humidity_pct": 58.0,
            "soil_moisture_pct": 52.0,
            "water_tank_level_cm": 140.0,
            "chemical_npk_available": False,
            "description": "Standard optimal growing environment."
        },
        "DROUGHT": {
            "temperature_c": 37.5,
            "humidity_pct": 24.0,
            "soil_moisture_pct": 18.5,
            "water_tank_level_cm": 45.0,
            "chemical_npk_available": False,
            "description": "Severe root zone moisture depletion and elevated ambient temperature."
        },
        "HEATWAVE": {
            "temperature_c": 41.8,
            "humidity_pct": 32.0,
            "soil_moisture_pct": 28.0,
            "water_tank_level_cm": 95.0,
            "chemical_npk_available": False,
            "description": "Extreme heat stress condition exceeding physiological stomatal closure thresholds."
        },
        "WATERLOGGED_FLOOD": {
            "temperature_c": 22.0,
            "humidity_pct": 92.0,
            "soil_moisture_pct": 96.0,
            "water_tank_level_cm": 195.0,
            "chemical_npk_available": False,
            "description": "Anoxic root zone with severe excess saturation and high flood risk."
        },
        "FUNGAL_RISK": {
            "temperature_c": 23.5,
            "humidity_pct": 94.0,
            "soil_moisture_pct": 68.0,
            "water_tank_level_cm": 160.0,
            "chemical_npk_available": False,
            "description": "Warm, saturated canopy conditions maximizing fungal spore germination."
        },
        "SENSOR_FAULT": {
            "temperature_c": 99.9,
            "humidity_pct": -15.0,
            "soil_moisture_pct": 105.0,
            "water_tank_level_cm": 550.0,
            "chemical_npk_available": False,
            "description": "Electrical hardware anomaly: open/short circuits producing invalid telemetry."
        },
        "NUTRIENT_DEFICIENCY_WITH_SOIL_KIT": {
            "temperature_c": 25.0,
            "humidity_pct": 55.0,
            "soil_moisture_pct": 48.0,
            "water_tank_level_cm": 120.0,
            "chemical_npk_available": True,
            "nitrogen_ppm": 12.0,  # Low (optimal is 30-50 ppm)
            "phosphorus_ppm": 18.0,
            "potassium_ppm": 160.0,
            "soil_ph": 6.4,
            "description": "Optical + chemical test kit connected: Verified severe Nitrogen deficiency."
        }
    }

    def __init__(self, initial_scenario: str = "OPTIMAL"):
        super().__init__(name="PhysicalSensorSimulator")
        self.is_connected = True
        self.active_scenario = initial_scenario if initial_scenario in self.SCENARIOS else "OPTIMAL"
        self._start_time = time.time()
        self._step = 0

    def set_scenario(self, scenario_name: str) -> bool:
        if scenario_name in self.SCENARIOS:
            self.active_scenario = scenario_name
            return True
        return False

    def read(self) -> SensorReading:
        self._step += 1
        cfg = self.SCENARIOS[self.active_scenario]

        if self.active_scenario == "OPTIMAL":
            # Add subtle time-of-day harmonic variation
            elapsed_hours = (time.time() - self._start_time) / 3600.0
            temp_var = 3.0 * math.sin(elapsed_hours * 2.0 * math.pi / 24.0)
            hum_var = -5.0 * math.sin(elapsed_hours * 2.0 * math.pi / 24.0)
            moist_decay = (self._step * 0.05) % 15.0  # slight drying

            temp = round(cfg["temperature_c"] + temp_var, 1)
            hum = max(10.0, min(95.0, round(cfg["humidity_pct"] + hum_var, 1)))
            moist = max(15.0, min(80.0, round(cfg["soil_moisture_pct"] - moist_decay, 1)))
            tank = round(cfg["water_tank_level_cm"], 1)
        else:
            temp = cfg["temperature_c"]
            hum = cfg["humidity_pct"]
            moist = cfg["soil_moisture_pct"]
            tank = cfg["water_tank_level_cm"]

        reading = SensorReading(
            timestamp=time.time(),
            source=f"simulator:{self.active_scenario}",
            temperature_c=temp,
            humidity_pct=hum,
            soil_moisture_pct=moist,
            water_tank_level_cm=tank,
            chemical_npk_available=cfg.get("chemical_npk_available", False),
            nitrogen_ppm=cfg.get("nitrogen_ppm"),
            phosphorus_ppm=cfg.get("phosphorus_ppm"),
            potassium_ppm=cfg.get("potassium_ppm"),
            soil_ph=cfg.get("soil_ph")
        )

        reading.validate_bounds()
        self.last_reading = reading
        return reading

    def health(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "connected": self.is_connected,
            "active_scenario": self.active_scenario,
            "scenario_description": self.SCENARIOS[self.active_scenario]["description"],
            "available_scenarios": list(self.SCENARIOS.keys())
        }
