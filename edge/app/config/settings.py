import os
import yaml
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class CameraConfig(BaseModel):
    source: Any = 0
    target_capture_fps: float = 30.0
    target_inference_fps: float = 8.0
    frame_skip: int = 3
    width: int = 640
    height: int = 480
    confidence_threshold: float = 60.0

class ModelsConfig(BaseModel):
    disease_model_path: str = "models/mobilenet_v2_plant_disease.onnx"
    disease_config_path: str = "models/onnx_config.json"
    disease_db_path: str = "models/plant_disease.json"
    pest_model_path: Optional[str] = "models/yolov8_pest.onnx"
    enable_cuda: bool = False

class SensorsConfig(BaseModel):
    provider: str = "simulator"
    serial_port: str = "/dev/ttyUSB0"
    serial_baud: int = 115200
    poll_interval_seconds: float = 5.0
    simulator: Dict[str, Any] = Field(default_factory=dict)

class DecisionConfig(BaseModel):
    critical_soil_moisture_pct: float = 30.0
    high_temperature_threshold_c: float = 35.0
    heat_wave_threshold_c: float = 38.0
    drought_moisture_threshold_c: float = 22.0

class StorageConfig(BaseModel):
    db_path: str = "edge/edge.db"
    max_local_records: int = 10000

class SyncConfig(BaseModel):
    cloud_backend_url: str = "http://localhost:8000/api/edge/sync"
    sync_interval_seconds: float = 15.0
    batch_size: int = 20
    offline_first: bool = True

class ServiceConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = False
    name: str = "KrishiVision-Edge-Node-01"
    field_id: str = "field-indore-1"
    farm_id: str = "farm-indore-001"

class EdgeSettings(BaseModel):
    device_profile: str = "laptop"
    service: ServiceConfig = Field(default_factory=ServiceConfig)
    camera: CameraConfig = Field(default_factory=CameraConfig)
    models: ModelsConfig = Field(default_factory=ModelsConfig)
    sensors: SensorsConfig = Field(default_factory=SensorsConfig)
    decision: DecisionConfig = Field(default_factory=DecisionConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    sync: SyncConfig = Field(default_factory=SyncConfig)

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "EdgeSettings":
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        if not config_path:
            config_path = os.path.join(root_dir, "edge", "config", "edge_config.yaml")

        data: Dict[str, Any] = {}
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}

        # Allow environment variable overrides
        if "DEVICE_PROFILE" in os.environ:
            data["device_profile"] = os.environ["DEVICE_PROFILE"]
        if "CAMERA_SOURCE" in os.environ:
            data.setdefault("camera", {})["source"] = os.environ["CAMERA_SOURCE"]
        if "SENSOR_PROVIDER" in os.environ:
            data.setdefault("sensors", {})["provider"] = os.environ["SENSOR_PROVIDER"]

        settings = cls(**data)

        # Resolve relative file paths against root directory
        def resolve(p: str) -> str:
            if p and not os.path.isabs(p):
                return os.path.join(root_dir, p)
            return p

        settings.models.disease_model_path = resolve(settings.models.disease_model_path)
        settings.models.disease_config_path = resolve(settings.models.disease_config_path)
        settings.models.disease_db_path = resolve(settings.models.disease_db_path)
        if settings.models.pest_model_path:
            settings.models.pest_model_path = resolve(settings.models.pest_model_path)
        settings.storage.db_path = resolve(settings.storage.db_path)

        return settings

edge_settings = EdgeSettings.load()
