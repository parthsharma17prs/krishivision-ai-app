from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import SensorReading
from app.schemas.schemas import RiskAnalysisResponse
from app.services.risk_engine import risk_engine
from app.services.weather_service import weather_service

router = APIRouter(prefix="/risk", tags=["Agricultural Risk Engine"])

@router.get("/{farm_id}", response_model=RiskAnalysisResponse)
async def get_farm_risk_assessment(farm_id: str, db: Session = Depends(get_db)):
    sr = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    moisture = sr.soil_moisture_pct if sr else 28.0
    temp = sr.temperature_c if sr else 32.5

    weather_data = await weather_service.get_weather()
    rain_prob = weather_data["rain_probability_pct"]

    return risk_engine.analyze(
        soil_moisture_pct=moisture,
        temperature_c=temp,
        rain_probability_pct=rain_prob,
        crop_name="Tomato"
    )

@router.post("/analyze", response_model=RiskAnalysisResponse)
async def analyze_farm_risk(farm_id: str = "farm-indore-001", db: Session = Depends(get_db)):
    return await get_farm_risk_assessment(farm_id, db)
