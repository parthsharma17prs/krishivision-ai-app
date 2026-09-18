from typing import Optional
from edge.app.sensors.base import BaseSensorProvider, SensorReading
from edge.app.sensors.simulator import PhysicalSensorSimulator
from edge.app.sensors.esp32 import ESP32HttpProvider
from edge.app.sensors.serial_prov import SerialSensorProvider
from edge.app.config.settings import edge_settings

def get_sensor_provider(provider_type: Optional[str] = None) -> BaseSensorProvider:
    """Factory creating appropriate sensor provider based on configuration."""
    ptype = (provider_type or edge_settings.sensors.provider).lower()

    if ptype in ["esp32", "esp32_http", "hardware"]:
        return ESP32HttpProvider()
    elif ptype in ["serial", "uart", "usb"]:
        return SerialSensorProvider(
            port=edge_settings.sensors.serial_port,
            baud=edge_settings.sensors.serial_baud
        )
    else:
        return PhysicalSensorSimulator()

__all__ = [
    "BaseSensorProvider",
    "SensorReading",
    "PhysicalSensorSimulator",
    "ESP32HttpProvider",
    "SerialSensorProvider",
    "get_sensor_provider"
]
