from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import SensorReading, Farm
from app.schemas.schemas import IrrigationAnalysisRequest, IrrigationAnalysisResponse
from app.services.irrigation_engine import irrigation_engine
from app.services.weather_service import weather_service

router = APIRouter(prefix="/irrigation", tags=["Smart Irrigation"])

@router.post("/analyze", response_model=IrrigationAnalysisResponse)
async def analyze_irrigation(req: IrrigationAnalysisRequest, db: Session = Depends(get_db)):
    # Retrieve current moisture from DB or request
    moisture = req.soil_moisture_pct
    temp = req.temperature_c
    humidity = req.humidity_pct

    if moisture is None or temp is None:
        sr = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
        if sr:
            moisture = moisture or sr.soil_moisture_pct
            temp = temp or sr.temperature_c
            humidity = humidity or sr.humidity_pct
        else:
            moisture = moisture or 28.0
            temp = temp or 32.5
            humidity = humidity or 54.0

    weather_data = await weather_service.get_weather()
    rain_prob = weather_data["rain_probability_pct"]

    res = irrigation_engine.analyze(
        soil_moisture_pct=moisture,
        temperature_c=temp,
        humidity_pct=humidity,
        rain_probability_pct=rain_prob,
        crop_name="Tomato"
    )

    return res

@router.get("/{farm_id}", response_model=IrrigationAnalysisResponse)
async def get_farm_irrigation_status(farm_id: str, db: Session = Depends(get_db)):
    req = IrrigationAnalysisRequest(farm_id=farm_id)
    return await analyze_irrigation(req, db)
