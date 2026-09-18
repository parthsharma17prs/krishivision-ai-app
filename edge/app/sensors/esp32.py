import time
from typing import Dict, Any, Optional
import requests
from edge.app.sensors.base import BaseSensorProvider, SensorReading

class ESP32HttpProvider(BaseSensorProvider):
    """
    ESP32 Hardware Sensor Provider.
    Supports both direct HTTP push ingestion from ESP32 WiFi clients
    and periodic polling of the ESP32 internal webserver.
    """

    def __init__(self, esp32_ip: Optional[str] = None, timeout_seconds: float = 2.5):
        super().__init__(name="ESP32-Hardware-Provider")
        self.esp32_ip = esp32_ip
        self.timeout_seconds = timeout_seconds
        self.last_push_time = 0.0

    def push_reading(self, payload: Dict[str, Any]) -> SensorReading:
        """
        Receives raw telemetry JSON pushed by ESP32 HTTP POST request.
        Expected keys from esp32_krishivision.ino:
        - temperature (or dht_temperature)
        - humidity (or dht_humidity)
        - soil_moisture (or soil_moisture_pct or soil_raw)
        - tank_level (or distance_cm or water_tank_level_cm)
        """
        temp = payload.get("temperature") or payload.get("dht_temperature") or payload.get("temp")
        hum = payload.get("humidity") or payload.get("dht_humidity")
        tank = payload.get("tank_level") or payload.get("distance_cm") or payload.get("water_tank_level_cm")

        # Soil moisture calibration: if raw ADC (0-4095) is provided, convert to %
        soil = payload.get("soil_moisture") or payload.get("soil_moisture_pct")
        if soil is None and "soil_raw" in payload:
            raw_adc = float(payload["soil_raw"])
            # Air ~ 3500, Water ~ 1400 in capacitive soil sensors
            calibrated = max(0.0, min(100.0, ((3500.0 - raw_adc) / (3500.0 - 1400.0)) * 100.0))
            soil = calibrated

        reading = SensorReading(
            timestamp=time.time(),
            source="hardware:esp32_http",
            temperature_c=float(temp) if temp is not None else None,
            humidity_pct=float(hum) if hum is not None else None,
            soil_moisture_pct=float(soil) if soil is not None else None,
            water_tank_level_cm=float(tank) if tank is not None else None,
            chemical_npk_available=False  # Standard ESP32 sketch has physical sensors only
        )

        reading.validate_bounds()
        self.last_reading = reading
        self.last_push_time = time.time()
        self.is_connected = True
        return reading

    def read(self) -> SensorReading:
        """Polls ESP32 endpoint if IP is configured, or returns latest pushed reading."""
        if self.esp32_ip:
            try:
                url = f"http://{self.esp32_ip}/sensors"
                res = requests.get(url, timeout=self.timeout_seconds)
                if res.status_code == 200:
                    return self.push_reading(res.json())
            except Exception as e:
                self.is_connected = False

        if self.last_reading and (time.time() - self.last_push_time < 30.0):
            return self.last_reading

        # Stale or disconnected
        self.is_connected = False
        return SensorReading(
            timestamp=time.time(),
            source="hardware:esp32_disconnected",
            is_valid=False,
            anomaly_flags=["HARDWARE_DISCONNECTED_OR_STALE"]
        )

    def health(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "connected": self.is_connected,
            "esp32_ip": self.esp32_ip,
            "last_push_age_seconds": round(time.time() - self.last_push_time, 1) if self.last_push_time > 0 else None
        }
