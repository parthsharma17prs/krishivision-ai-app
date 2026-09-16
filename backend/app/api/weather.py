from fastapi import APIRouter
from app.schemas.schemas import WeatherIntelligenceResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/current", response_model=WeatherIntelligenceResponse)
async def get_current_weather(location: str = "Indore, Madhya Pradesh"):
    return await weather_service.get_weather(location)

@router.get("/forecast", response_model=WeatherIntelligenceResponse)
async def get_weather_forecast(location: str = "Indore, Madhya Pradesh"):
    return await weather_service.get_weather(location)
