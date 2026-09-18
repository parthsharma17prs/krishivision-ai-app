import time
import json
from typing import Dict, Any, Optional
from edge.app.sensors.base import BaseSensorProvider, SensorReading

class SerialSensorProvider(BaseSensorProvider):
    """
    Direct USB Serial UART Sensor Provider.
    Reads streaming telemetry from microcontrollers connected via USB/UART.
    """

    def __init__(self, port: str = "/dev/ttyUSB0", baud: int = 115200):
        super().__init__(name="Serial-UART-Provider")
        self.port = port
        self.baud = baud
        self.serial_conn = None
        self._try_connect()

    def _try_connect(self) -> bool:
        try:
            import serial
            self.serial_conn = serial.Serial(self.port, self.baud, timeout=1.0)
            self.is_connected = True
            return True
        except Exception:
            self.serial_conn = None
            self.is_connected = False
            return False

    def read(self) -> SensorReading:
        if not self.is_connected or not self.serial_conn:
            if not self._try_connect():
                return SensorReading(
                    timestamp=time.time(),
                    source=f"serial:{self.port}",
                    is_valid=False,
                    anomaly_flags=["SERIAL_PORT_UNAVAILABLE"]
                )

        try:
            line = self.serial_conn.readline().decode("utf-8", errors="ignore").strip()
            if line.startswith("{") and line.endswith("}"):
                data = json.loads(line)
                reading = SensorReading(
                    timestamp=time.time(),
                    source=f"serial:{self.port}",
                    temperature_c=data.get("temp") or data.get("temperature"),
                    humidity_pct=data.get("hum") or data.get("humidity"),
                    soil_moisture_pct=data.get("soil") or data.get("soil_moisture"),
                    water_tank_level_cm=data.get("tank") or data.get("tank_level"),
                    chemical_npk_available=False
                )
                reading.validate_bounds()
                self.last_reading = reading
                return reading
        except Exception as e:
            self.is_connected = False

        return self.last_reading or SensorReading(
            timestamp=time.time(),
            source=f"serial:{self.port}",
            is_valid=False,
            anomaly_flags=["NO_SERIAL_DATA"]
        )

    def health(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "connected": self.is_connected,
            "port": self.port,
            "baud": self.baud
        }
