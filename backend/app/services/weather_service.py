import os
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.core.config import settings

class WeatherProvider(ABC):
    @abstractmethod
    async def get_weather(self, location: str = "Indore, Madhya Pradesh") -> Dict[str, Any]:
        pass

class DemoWeatherProvider(WeatherProvider):
    """
    Deterministic Demo Weather Provider for offline/hackathon reliability.
    Returns realistic weather patterns for Indore, MP.
    """
    async def get_weather(self, location: str = "Indore, Madhya Pradesh") -> Dict[str, Any]:
        return {
            "location": location,
            "temperature_c": 32.5,
            "humidity_pct": 54.0,
            "rainfall_mm": 0.0,
            "rain_probability_pct": 15.0,
            "wind_speed_kmh": 14.2,
            "condition": "Partly Cloudy",
            "heat_risk_level": "MODERATE",
            "heavy_rain_risk_level": "LOW",
            "hourly_forecast": [
                {"time": "09:00", "temp_c": 28.0, "humidity_pct": 65.0, "rain_prob_pct": 10.0},
                {"time": "12:00", "temp_c": 32.5, "humidity_pct": 54.0, "rain_prob_pct": 15.0},
                {"time": "15:00", "temp_c": 34.0, "humidity_pct": 48.0, "rain_prob_pct": 20.0},
                {"time": "18:00", "temp_c": 31.0, "humidity_pct": 58.0, "rain_prob_pct": 15.0},
                {"time": "21:00", "temp_c": 27.5, "humidity_pct": 70.0, "rain_prob_pct": 5.0}
            ],
            "daily_forecast": [
                {"date": "2026-09-16", "day_name": "Today", "max_temp_c": 34.0, "min_temp_c": 24.0, "rain_prob_pct": 15.0, "condition": "Partly Cloudy", "icon": "cloud-sun"},
                {"date": "2026-09-17", "day_name": "Thu", "max_temp_c": 35.0, "min_temp_c": 24.5, "rain_prob_pct": 20.0, "condition": "Sunny", "icon": "sun"},
                {"date": "2026-09-18", "day_name": "Fri", "max_temp_c": 33.0, "min_temp_c": 23.5, "rain_prob_pct": 45.0, "condition": "Light Shower", "icon": "cloud-rain"},
                {"date": "2026-09-19", "day_name": "Sat", "max_temp_c": 31.0, "min_temp_c": 23.0, "rain_prob_pct": 70.0, "condition": "Thunderstorm", "icon": "cloud-lightning"},
                {"date": "2026-09-20", "day_name": "Sun", "max_temp_c": 30.5, "min_temp_c": 22.8, "rain_prob_pct": 60.0, "condition": "Moderate Rain", "icon": "cloud-rain"},
                {"date": "2026-09-21", "day_name": "Mon", "max_temp_c": 32.0, "min_temp_c": 23.0, "rain_prob_pct": 25.0, "condition": "Clearing", "icon": "cloud-sun"},
                {"date": "2026-09-22", "day_name": "Tue", "max_temp_c": 33.5, "min_temp_c": 24.0, "rain_prob_pct": 10.0, "condition": "Sunny", "icon": "sun"}
            ],
            "provider_mode": "DEMO"
        }

class OpenWeatherProvider(WeatherProvider):
    """
    Live OpenWeatherMap API Integration Provider.
    Used when OPENWEATHER_API_KEY is configured in .env.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def get_weather(self, location: str = "Indore, Madhya Pradesh") -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={self.api_key}&units=metric"
                res = await client.get(url, timeout=5.0)
                if res.status_code == 200:
                    data = res.json()
                    main = data.get("main", {})
                    wind = data.get("wind", {})
                    weather_desc = data.get("weather", [{}])[0].get("description", "Clear").title()
                    
                    return {
                        "location": location,
                        "temperature_c": float(main.get("temp", 32.0)),
                        "humidity_pct": float(main.get("humidity", 50.0)),
                        "rainfall_mm": float(data.get("rain", {}).get("1h", 0.0)),
                        "rain_probability_pct": 20.0,
                        "wind_speed_kmh": float(wind.get("speed", 3.0) * 3.6),
                        "condition": weather_desc,
                        "heat_risk_level": "MODERATE" if main.get("temp", 32.0) > 35.0 else "LOW",
                        "heavy_rain_risk_level": "LOW",
                        "hourly_forecast": DemoWeatherProvider().get_weather(location)["hourly_forecast"],
                        "daily_forecast": DemoWeatherProvider().get_weather(location)["daily_forecast"],
                        "provider_mode": "LIVE"
                    }
        except Exception:
            pass
        
        # Fallback if API call fails
        return await DemoWeatherProvider().get_weather(location)

def get_weather_service() -> WeatherProvider:
    if settings.WEATHER_PROVIDER == "openweather" and settings.OPENWEATHER_API_KEY:
        return OpenWeatherProvider(settings.OPENWEATHER_API_KEY)
    return DemoWeatherProvider()

weather_service = get_weather_service()
