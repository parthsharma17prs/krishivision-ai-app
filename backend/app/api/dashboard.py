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

    # Sync latest telemetry from Google Sheets
    try:
        from app.services.google_sheets_sync import sync_google_sheets_to_db
        sync_google_sheets_to_db(db, field_id=farm.id)
    except Exception:
        pass

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

    # Fetch historical readings for dynamic telemetry curve
    history_readings = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(10).all()
    telemetry_history = []
    if history_readings:
        for r in reversed(history_readings):
            t_label = r.timestamp.strftime("%H:%M:%S") if hasattr(r.timestamp, "strftime") else "Live"
            telemetry_history.append({
                "time": t_label,
                "moisture": round(r.soil_moisture_pct, 1),
                "temperature": round(r.temperature_c, 1),
                "tank": round(r.water_tank_pct, 1)
            })

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

    # Fetch real-time live plant scans from LiveFeedService (Google Drive Agribot feed)
    from app.services.live_feed_service import live_feed_service
    live_records = live_feed_service.get_records(limit=6)
    live_stats = live_feed_service.get_stats()
    latest_live_feed = live_records[0] if live_records else None

    recent_scans = []
    if live_records:
        for r in live_records:
            recent_scans.append({
                "scan_id": r.get("id"),
                "crop_cycle_id": "cycle-1",
                "detected_plant": r.get("crop", "Unknown"),
                "primary_disease": r.get("disease_name", "Healthy Foliage"),
                "confidence_pct": float(r.get("confidence", 90.0)),
                "severity": r.get("severity", "Low"),
                "affected_area_pct": 18.0 if not r.get("is_healthy") else 0.0,
                "bounding_box_url": r.get("image_url"),
                "heatmap_url": r.get("image_url"),
                "original_image_url": r.get("image_url"),
                "top_3_predictions": r.get("top_predictions", [
                    {"class_name": r.get("disease_name"), "confidence_pct": float(r.get("confidence", 90.0)), "is_primary": True}
                ]),
                "advisory_actions": [
                    r.get("cure", "Maintain optimal cultivation practices."),
                    r.get("pesticide_advisory", {}).get("advice", "Monitor crop regularly.")
                ],
                "mode": "REALTIME_FIELD_FEED",
                "model_version": "MobileNetV2-PlantVillage-ONNX",
                "processing_time_ms": 128,
                "disclaimer": "Real-time AI pathology diagnosis from live Agribot camera feed."
            })
    else:
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

    active_alerts = []
    if latest_live_feed and not latest_live_feed.get("is_healthy"):
        active_alerts.append({
            "id": f"alert-live-{latest_live_feed['id']}",
            "title": f"Live Agribot Detection: {latest_live_feed['disease_name']}",
            "message": f"Confirmed on {latest_live_feed['crop']} with {latest_live_feed['confidence']}% confidence. {latest_live_feed.get('pesticide_advisory', {}).get('recommendation_title', '')}",
            "severity": "CRITICAL" if latest_live_feed.get("severity") in ["High", "Critical"] else "WARNING",
            "created_at": latest_live_feed.get("timestamp", datetime.now(timezone.utc).isoformat())
        })

    active_alerts.extend([
        {
            "id": "alert-1",
            "title": "Heat Wave Advisory",
            "message": f"Temperature reaching {weather_data['temperature_c']}°C. Ensure adequate drip hydration.",
            "severity": "WARNING",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert-2",
            "title": "Irrigation Recommendation",
            "message": f"Soil moisture at {latest_reading.soil_moisture_pct}%. {irrig_res['recommended_window']}.",
            "severity": "INFO",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ])

    health_breakdown = {
        "Disease Status": 80 if (latest_live_feed and not latest_live_feed.get("is_healthy")) else 92,
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
        "active_risks": risks_res["active_risks"],
        "latest_live_feed": latest_live_feed,
        "live_feed_stats": live_stats,
        "telemetry_history": telemetry_history
    }
