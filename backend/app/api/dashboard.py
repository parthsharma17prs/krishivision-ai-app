from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Farm, Field, SensorReading, PlantScan, Alert
from app.schemas.schemas import DashboardOverviewResponse
from app.services.weather_service import weather_service
from app.services.irrigation_engine import irrigation_engine
from app.services.risk_engine import risk_engine
from datetime import datetime, timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/{farm_id}", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        farm = db.query(Farm).first()
    
    if not farm:
        # Create default demo farm if db is clean
        farm = Farm(
            id="farm-indore-001",
            user_id="demo-user-id",
            name="Farm 01 — Indore",
            location="Indore, Madhya Pradesh",
            state="Madhya Pradesh",
            district="Indore",
            total_area_acres=5.0,
            main_crop="Tomato",
            health_score=82,
            created_at=datetime.now(timezone.utc)
        )

    # Fetch latest sensor reading
    latest_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    if not latest_reading:
        latest_reading = SensorReading(
            id="sr-demo-1",
            field_id="field-demo-1",
            soil_moisture_pct=28.0,
            temperature_c=32.5,
            humidity_pct=54.0,
            water_tank_pct=70.0,
            timestamp=datetime.now(timezone.utc)
        )

    # Weather forecast
    weather_data = await weather_service.get_weather(farm.location)

    # Irrigation calculation
    irrig_res = irrigation_engine.analyze(
        soil_moisture_pct=latest_reading.soil_moisture_pct,
        temperature_c=latest_reading.temperature_c,
        humidity_pct=latest_reading.humidity_pct,
        rain_probability_pct=weather_data["rain_probability_pct"],
        crop_name=farm.main_crop
    )

    # Risks
    risks_res = risk_engine.analyze(
        soil_moisture_pct=latest_reading.soil_moisture_pct,
        temperature_c=latest_reading.temperature_c,
        rain_probability_pct=weather_data["rain_probability_pct"],
        crop_name=farm.main_crop
    )

    # Recent scans demo
    recent_scans = [
        {
            "scan_id": "scan-demo-101",
            "crop_cycle_id": "cycle-1",
            "detected_plant": "Tomato",
            "primary_disease": "Tomato Early Blight",
            "confidence_pct": 91.4,
            "severity": "Moderate",
            "affected_area_pct": 18.0,
            "bounding_box_url": "/uploads/bbox_demo.jpg",
            "heatmap_url": "/uploads/heatmap_demo.jpg",
            "original_image_url": "/uploads/leaf_sample.jpg",
            "top_3_predictions": [
                {"class_name": "Tomato Early Blight", "confidence_pct": 91.4, "is_primary": True},
                {"class_name": "Tomato Late Blight", "confidence_pct": 5.2, "is_primary": False},
                {"class_name": "Tomato Septoria Leaf Spot", "confidence_pct": 2.1, "is_primary": False}
            ],
            "advisory_actions": [
                "Prune lower infected foliage displaying target-shaped spots.",
                "Avoid overhead irrigation to keep leaf canopy dry."
            ],
            "mode": "DEMO",
            "model_version": "YOLOv11+ViT-v1.0",
            "processing_time_ms": 142,
            "disclaimer": "AI advisory model. Verify critical crop diagnoses with an agricultural extension officer."
        }
    ]

    active_alerts = [
        {
            "id": "alert-1",
            "title": "Heat Wave Warning",
            "message": "Temperature reaching 34°C today. Ensure adequate drip hydration.",
            "severity": "WARNING",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert-2",
            "title": "Irrigation Recommendation",
            "message": "Soil moisture at 28%. Irrigation window recommended within 4 hours.",
            "severity": "INFO",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    health_breakdown = {
        "Disease Status": 85,
        "Irrigation Balance": 78,
        "Nutrient Levels": 88,
        "Weather Resilience": 79
    }

    return {
        "farm": farm,
        "health_score": farm.health_score,
        "health_score_breakdown": health_breakdown,
        "current_telemetry": latest_reading,
        "weather": weather_data,
        "irrigation_summary": irrig_res,
        "recent_scans": recent_scans,
        "active_alerts": active_alerts,
        "active_risks": risks_res["active_risks"]
    }
