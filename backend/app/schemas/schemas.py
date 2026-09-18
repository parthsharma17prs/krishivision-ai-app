from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Auth & User
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Farm & Field
class FarmCreate(BaseModel):
    name: str
    location: str
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Indore"
    total_area_acres: Optional[float] = 5.0
    main_crop: Optional[str] = "Tomato"

class FieldOut(BaseModel):
    id: str
    name: str
    area_acres: float
    soil_type: str
    irrigation_type: str

    class Config:
        from_attributes = True

class FarmOut(BaseModel):
    id: str
    name: str
    location: str
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Indore"
    total_area_acres: Optional[float] = 5.0
    main_crop: Optional[str] = "Tomato"
    health_score: Optional[int] = 82
    fields: List[FieldOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Sensors & IoT
class SensorReadingCreate(BaseModel):
    field_id: str
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    water_tank_pct: float

class SensorReadingOut(BaseModel):
    id: str
    field_id: str
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    water_tank_pct: float
    timestamp: datetime

    class Config:
        from_attributes = True

# Plant Doctor (Disease Detection)
class PredictionItem(BaseModel):
    class_name: str
    confidence_pct: float
    is_primary: bool = False

class DiseaseAnalysisResponse(BaseModel):
    scan_id: str
    crop_cycle_id: str
    detected_plant: str
    primary_disease: str
    confidence_pct: float
    severity: str
    affected_area_pct: Optional[float] = None
    bounding_box_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    cause: Optional[str] = None
    cure: Optional[str] = None
    raw_name: Optional[str] = None
    pesticide_advisory: Optional[Dict[str, Any]] = None
    nutrient_analysis: Optional[Dict[str, Any]] = None
    original_image_url: str
    top_3_predictions: List[PredictionItem]
    advisory_actions: List[str]
    mode: str  # REAL_MODEL, DEMO
    model_version: str
    processing_time_ms: int
    disclaimer: str = "AI advisory model. Verify critical crop diagnoses with an agricultural extension officer."

# Pest Detection
class PestAnalysisRequest(BaseModel):
    field_id: str
    crop_name: Optional[str] = "Tomato"

class PestDetectionItem(BaseModel):
    pest_name: str
    confidence_pct: float
    bounding_box: List[float]  # [x, y, w, h]
    severity: Optional[str] = "Moderate"

class PestAnalysisResponse(BaseModel):
    scan_id: str
    detected_pests: List[PestDetectionItem]
    pest_count: Optional[int] = 0
    overall_severity: str
    economic_threshold_status: Optional[str] = "BELOW_ECONOMIC_THRESHOLD"
    recommended_control: List[str]
    ipm_recommendations: Optional[Dict[str, List[str]]] = None
    annotated_image_url: Optional[str] = ""
    mode: str
    label_notice: str = "Real-time YOLOv8 ONNX Pest Detection Engine"
    processing_time_ms: Optional[float] = 0.0

# Nutrient Deficiency
class NutrientDetailItem(BaseModel):
    code: str
    name: str
    status: str  # OPTIMAL, MILD DEFICIT, DEFICIENT, CRITICAL DEFICIT
    deficit_pct: float
    current_level: float
    target_level: float
    unit: str
    symptoms: Optional[str] = ""
    prescription: Optional[str] = ""
    foliar_spray: Optional[str] = ""
    organic_alternative: Optional[str] = ""

class NutrientAnalysisRequest(BaseModel):
    field_id: str
    crop_name: str = "Corn (Maize)"
    growth_stage: str = "Flowering & Fruit Setting"
    soil_ph: Optional[float] = 6.8
    npk_sensor: Optional[Dict[str, float]] = Field(default_factory=lambda: {"N": 120, "P": 45, "K": 180})
    micronutrient_sensor: Optional[Dict[str, float]] = Field(default_factory=lambda: {"Mg": 2.8, "Fe": 5.5, "Zn": 1.4})
    symptoms_observed: Optional[List[str]] = Field(default_factory=lambda: ["Yellowing of lower leaves"])
    image_url: Optional[str] = None
    sample_path: Optional[str] = None

class NutrientAnalysisResponse(BaseModel):
    field_id: str
    likely_deficiency: str
    confidence_pct: float
    health_score: Optional[float] = 85.0
    deficiency_breakdown: Dict[str, float]  # N, P, K, Mg, Fe, Zn % scores
    nutrients_detail: Optional[List[NutrientDetailItem]] = None
    ph_bioavailability_impact: Optional[str] = ""
    supporting_evidence: List[str]
    recommended_fertilizer_advisory: List[str]
    fertilizer_recipe: Optional[Dict[str, Optional[str]]] = None
    recommended_soil_test: str
    annotated_heatmap_url: Optional[str] = ""
    original_image_url: Optional[str] = ""
    image_cv_analysis: Optional[Dict[str, Any]] = None
    mode: str = "HYBRID_ML_MATRIX"
    notice: str = "Agronomic diagnostic model — verify with soil/leaf petiole testing before applying bulk heavy fertilizers."
    processing_time_ms: Optional[float] = 0.0

# Smart Irrigation
class IrrigationAnalysisRequest(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    soil_moisture_pct: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None

class IrrigationAnalysisResponse(BaseModel):
    farm_id: str
    field_name: str
    crop_name: str
    irrigate_required: bool
    urgency: str  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_window: str
    estimated_water_liters_per_acre: float
    current_soil_moisture_pct: float
    optimal_moisture_range_pct: str
    reasoning: List[str]
    water_saving_explanation: str
    mode: str = "RULE_ENGINE"

# Weather Intelligence
class HourlyForecastItem(BaseModel):
    time: str
    temp_c: float
    humidity_pct: float
    rain_prob_pct: float

class DailyForecastItem(BaseModel):
    date: str
    day_name: str
    max_temp_c: float
    min_temp_c: float
    rain_prob_pct: float
    condition: str
    icon: str

class WeatherIntelligenceResponse(BaseModel):
    location: str
    temperature_c: float
    humidity_pct: float
    rainfall_mm: float
    rain_probability_pct: float
    wind_speed_kmh: float
    condition: str
    heat_risk_level: str
    heavy_rain_risk_level: str
    hourly_forecast: List[HourlyForecastItem]
    daily_forecast: List[DailyForecastItem]
    provider_mode: str  # DEMO or LIVE

# Agricultural Risk Assessment
class RiskFactor(BaseModel):
    risk_type: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    score_pct: float
    title: str
    description: str
    mitigation_steps: List[str]

class RiskAnalysisResponse(BaseModel):
    farm_id: str
    overall_farm_risk_level: str
    assessment_date: datetime
    active_risks: List[RiskFactor]
    mode: str = "RULE_ENGINE"
    disclaimer: str = "Risk assessment based on weather telemetry and environmental thresholds."

# AI Farmer Assistant
class AssistantChatRequest(BaseModel):
    farm_id: str
    query: str
    language: Optional[str] = "English"

class AssistantChatResponse(BaseModel):
    farm_id: str
    user_query: str
    response_text: str
    detected_language: str
    suggested_followups: List[str]
    mode: str

# Reports
class ReportOut(BaseModel):
    id: str
    farm_id: str
    report_type: str
    title: str
    file_path: str
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Overview
class DashboardOverviewResponse(BaseModel):
    farm: FarmOut
    health_score: int
    health_score_breakdown: Dict[str, int]
    current_telemetry: SensorReadingOut
    weather: WeatherIntelligenceResponse
    irrigation_summary: IrrigationAnalysisResponse
    recent_scans: List[DiseaseAnalysisResponse]
    active_alerts: List[Dict[str, Any]]
    active_risks: List[RiskFactor]
    latest_live_feed: Optional[Dict[str, Any]] = None
    live_feed_stats: Optional[Dict[str, Any]] = None
    telemetry_history: Optional[List[Dict[str, Any]]] = None

# System & Models Status
class ModelStatusItem(BaseModel):
    model_key: str
    architecture: str
    provider: str
    status: str  # available, demo, uninitialized
    mode: str

class SystemStatusResponse(BaseModel):
    system_name: str
    environment: str
    demo_mode: bool
    database_connected: bool
    models: List[ModelStatusItem]
