import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class SensorReading(BaseModel):
    """
    Standardized edge telemetry reading model.
    Enforces validation ranges and multimodal nutrient sensor availability transparency.
    """
    timestamp: float = Field(default_factory=time.time)
    source: str = "unknown"
    is_valid: bool = True
    anomaly_flags: List[str] = Field(default_factory=list)

    # Physical environmental telemetry
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    water_tank_level_cm: Optional[float] = None
    solar_radiation_w_m2: Optional[float] = None

    # Chemical soil sensor availability (strict scientific honesty)
    # RGB cameras detect visual chlorosis/necrosis symptoms;
    # exact soil N/P/K ppm requires chemical sensor electrodes.
    chemical_npk_available: bool = False
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None
    soil_ph: Optional[float] = None

    def validate_bounds(self) -> None:
        """Flags out-of-bound or impossible physical sensor readings."""
        if self.temperature_c is not None:
            if self.temperature_c < -20.0 or self.temperature_c > 70.0:
                self.anomaly_flags.append(f"TEMPERATURE_OUT_OF_BOUNDS_{self.temperature_c}C")
                self.is_valid = False

        if self.humidity_pct is not None:
            if self.humidity_pct < 0.0 or self.humidity_pct > 100.0:
                self.anomaly_flags.append(f"HUMIDITY_OUT_OF_BOUNDS_{self.humidity_pct}%")
                self.is_valid = False

        if self.soil_moisture_pct is not None:
            if self.soil_moisture_pct < 0.0 or self.soil_moisture_pct > 100.0:
                self.anomaly_flags.append(f"SOIL_MOISTURE_OUT_OF_BOUNDS_{self.soil_moisture_pct}%")
                self.is_valid = False

        if self.water_tank_level_cm is not None:
            if self.water_tank_level_cm < 0.0 or self.water_tank_level_cm > 500.0:
                self.anomaly_flags.append(f"TANK_LEVEL_OUT_OF_BOUNDS_{self.water_tank_level_cm}cm")
                self.is_valid = False

class BaseSensorProvider(ABC):
    """Abstract interface for all hardware or simulated sensor inputs."""

    def __init__(self, name: str):
        self.name = name
        self.is_connected = False
        self.last_reading: Optional[SensorReading] = None

    @abstractmethod
    def read(self) -> SensorReading:
        """Captures and returns the latest calibrated sensor telemetry."""
        pass

    @abstractmethod
    def health(self) -> Dict[str, Any]:
        """Returns connection state, hardware port, and diagnostic health."""
        pass
