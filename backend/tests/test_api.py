import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "degraded"]
    assert "environment" in data

def test_system_mode():
    response = client.get("/api/system/mode")
    assert response.status_code == 200
    data = response.json()
    assert "demo_mode" in data

def test_models_status():
    response = client.get("/api/models/status")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

def test_dashboard_overview():
    response = client.get("/api/dashboard/farm-indore-001")
    assert response.status_code == 200
    data = response.json()
    assert "health_score" in data
    assert "current_telemetry" in data
    assert "irrigation_summary" in data

def test_irrigation_analyze():
    payload = {
        "farm_id": "farm-indore-001",
        "soil_moisture_pct": 22.0,
        "temperature_c": 35.0,
        "humidity_pct": 45.0
    }
    response = client.post("/api/irrigation/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "irrigate_required" in data
    assert "reasoning" in data

def test_risk_analyze():
    response = client.get("/api/risk/farm-indore-001")
    assert response.status_code == 200
    data = response.json()
    assert "overall_farm_risk_level" in data
    assert "active_risks" in data

def test_weather_forecast():
    response = client.get("/api/weather/forecast")
    assert response.status_code == 200
    data = response.json()
    assert "temperature_c" in data
    assert "daily_forecast" in data

def test_assistant_chat():
    payload = {
        "farm_id": "farm-indore-001",
        "query": "Meri tomato ki leaves pe brown spots aa rahe hain",
        "language": "Hinglish"
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response_text" in data

def test_pest_analysis():
    payload = {"field_id": "field-indore-1", "crop_name": "Tomato"}
    response = client.post("/api/analysis/pest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "detected_pests" in data

def test_nutrient_analysis():
    payload = {
        "field_id": "field-indore-1",
        "crop_name": "Tomato",
        "growth_stage": "Flowering & Fruit Setting"
    }
    response = client.post("/api/analysis/nutrient", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "likely_deficiency" in data

def test_generate_report():
    response = client.post("/api/reports?farm_id=farm-indore-001")
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
