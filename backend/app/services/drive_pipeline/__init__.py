"""
Drive Pipeline: Reusable Google Drive Data Ingestion & ML Model Integration Engine.
"""

from .config import DriveConfig
from .auth import DriveAuth
from .client import DriveClient
from .pipeline import DriveImagePipeline
from .adapters import BaseModelAdapter, CallableAdapter, PlantDoctorAdapter

__all__ = [
    "DriveConfig",
    "DriveAuth",
    "DriveClient",
    "DriveImagePipeline",
    "BaseModelAdapter",
    "CallableAdapter",
    "PlantDoctorAdapter",
]
