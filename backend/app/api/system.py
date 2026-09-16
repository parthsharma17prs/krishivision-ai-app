import json
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.schemas import SystemStatusResponse, ModelStatusItem
from app.ml.disease_adapter import disease_adapter
from app.ml.pest_adapter import pest_adapter
from app.ml.nutrient_adapter import nutrient_adapter
from app.core.config import settings

router = APIRouter(tags=["System & Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "service": "KrishiVision AI Backend",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "database_connected": db_ok
    }

@router.get("/models/status")
def get_models_status():
    models = [
        ModelStatusItem(
            model_key="disease",
            architecture=disease_adapter.health()["architecture"],
            provider=disease_adapter.health()["provider"],
            status="available" if disease_adapter.is_loaded else "uninitialized",
            mode=disease_adapter.mode
        ),
        ModelStatusItem(
            model_key="pest",
            architecture=pest_adapter.health()["architecture"],
            provider="YOLO Pest Adapter",
            status="demo",
            mode=pest_adapter.mode
        ),
        ModelStatusItem(
            model_key="nutrient",
            architecture=nutrient_adapter.health()["architecture"],
            provider="Multimodal Knowledge Matrix",
            status="available",
            mode=nutrient_adapter.mode
        )
    ]
    return models

@router.get("/system/mode")
def get_system_mode():
    return {
        "demo_mode": settings.DEMO_MODE,
        "weather_provider": settings.WEATHER_PROVIDER,
        "assistant_provider": settings.ASSISTANT_PROVIDER,
        "environment": settings.ENVIRONMENT
    }
