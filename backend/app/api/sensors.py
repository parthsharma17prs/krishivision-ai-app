from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import SensorReading
from app.schemas.schemas import SensorReadingCreate, SensorReadingOut

router = APIRouter(prefix="/sensors", tags=["IoT Sensors Telemetry"])

@router.post("/readings", response_model=SensorReadingOut)
def record_sensor_reading(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    reading = SensorReading(
        field_id=reading_in.field_id,
        soil_moisture_pct=reading_in.soil_moisture_pct,
        temperature_c=reading_in.temperature_c,
        humidity_pct=reading_in.humidity_pct,
        water_tank_pct=reading_in.water_tank_pct,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading

@router.get("/{field_id}/latest", response_model=SensorReadingOut)
def get_latest_sensor_reading(field_id: str, db: Session = Depends(get_db)):
    reading = db.query(SensorReading).filter(SensorReading.field_id == field_id).order_by(SensorReading.timestamp.desc()).first()
    if not reading:
        # Create default demo reading if empty
        reading = SensorReading(
            id="sr-demo-latest",
            field_id=field_id,
            soil_moisture_pct=28.0,
            temperature_c=32.5,
            humidity_pct=54.0,
            water_tank_pct=70.0,
            timestamp=datetime.now(timezone.utc)
        )
    return reading

@router.get("/{field_id}/history", response_model=List[SensorReadingOut])
def get_sensor_history(field_id: str, limit: int = 24, db: Session = Depends(get_db)):
    readings = db.query(SensorReading).filter(SensorReading.field_id == field_id).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    if not readings:
        readings = [
            SensorReading(
                id=f"sr-hist-{i}",
                field_id=field_id,
                soil_moisture_pct=25.0 + (i % 5),
                temperature_c=30.0 + (i % 4),
                humidity_pct=50.0 + (i % 6),
                water_tank_pct=70.0 - (i % 3),
                timestamp=datetime.now(timezone.utc)
            ) for i in range(10)
        ]
    return readings
