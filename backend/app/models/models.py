import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="farmer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)  # e.g., "Indore, MP"
    state = Column(String(100), default="Madhya Pradesh")
    district = Column(String(100), default="Indore")
    total_area_acres = Column(Float, default=5.0)
    main_crop = Column(String(100), default="Tomato")
    health_score = Column(Integer, default=82)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    area_acres = Column(Float, default=2.5)
    soil_type = Column(String(100), default="Black Soil (Regur)")
    irrigation_type = Column(String(100), default="Drip Irrigation")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    farm = relationship("Farm", back_populates="fields")
    crop_cycles = relationship("CropCycle", back_populates="field", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="field", cascade="all, delete-orphan")

class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)  # Tomato, Cotton, Wheat, Rice
    variety = Column(String(100), default="Hybrid Solanum")
    sowing_date = Column(DateTime(timezone=True), default=utc_now)
    growth_stage = Column(String(100), default="Flowering & Fruit Setting")  # Seedling, Vegetative, Flowering, Maturity
    expected_harvest_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    field = relationship("Field", back_populates="crop_cycles")
    scans = relationship("PlantScan", back_populates="crop_cycle", cascade="all, delete-orphan")
    irrigation_events = relationship("IrrigationEvent", back_populates="crop_cycle", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    soil_moisture_pct = Column(Float, nullable=False, default=28.0)
    temperature_c = Column(Float, nullable=False, default=32.5)
    humidity_pct = Column(Float, nullable=False, default=55.0)
    water_tank_pct = Column(Float, nullable=False, default=70.0)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)

    field = relationship("Field", back_populates="sensor_readings")

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    temperature_c = Column(Float, default=31.0)
    humidity_pct = Column(Float, default=52.0)
    rainfall_mm = Column(Float, default=0.0)
    rain_probability_pct = Column(Float, default=15.0)
    wind_speed_kmh = Column(Float, default=12.0)
    forecast_date = Column(DateTime(timezone=True), default=utc_now, index=True)
    mode = Column(String(50), default="DEMO")  # DEMO or LIVE

class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_cycle_id = Column(String(36), ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    irrigate_required = Column(Boolean, default=False)
    urgency = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_window = Column(String(255), default="Within 4 hours")
    estimated_water_liters_per_acre = Column(Float, default=1200.0)
    reasoning_json = Column(JSON, default=list)
    mode = Column(String(50), default="RULE_ENGINE")
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    crop_cycle = relationship("CropCycle", back_populates="irrigation_events")

class PlantScan(Base):
    __tablename__ = "plant_scans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_cycle_id = Column(String(36), ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(512), nullable=False)
    detected_plant = Column(String(100), default="Tomato")
    primary_disease = Column(String(150), default="Tomato Early Blight")
    confidence_pct = Column(Float, default=91.4)
    severity = Column(String(50), default="Moderate")
    affected_area_pct = Column(Float, nullable=True, default=18.0)
    bounding_box_url = Column(String(512), nullable=True)
    heatmap_url = Column(String(512), nullable=True)
    top_3_predictions = Column(JSON, default=list)
    advisory_actions = Column(JSON, default=list)
    mode = Column(String(50), default="DEMO")  # REAL_MODEL, DEMO
    model_version = Column(String(100), default="YOLOv11+ViT-v1.0")
    processing_time_ms = Column(Integer, default=145)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    crop_cycle = relationship("CropCycle", back_populates="scans")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_type = Column(String(100), nullable=False)  # Heat Wave, Drought, Waterlogging, Disease Outbreak
    risk_level = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    score_pct = Column(Float, default=45.0)
    supporting_evidence = Column(JSON, default=list)
    advisory_action = Column(Text, nullable=True)
    mode = Column(String(50), default="RULE_ENGINE")
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)  # DISEASE, PEST, IRRIGATION, WEATHER, RISK
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="WARNING")  # INFO, WARNING, HIGH, CRITICAL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    farm = relationship("Farm", back_populates="alerts")

class AssistantMessage(Base):
    __tablename__ = "assistant_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_query = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    language = Column(String(20), default="English")  # English, Hindi, Hinglish
    suggested_actions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(100), default="Farm Diagnostic & Irrigation Report")
    title = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    download_url = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    farm = relationship("Farm", back_populates="reports")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_key = Column(String(100), unique=True, nullable=False)  # disease, pest, nutrient, irrigation, risk
    architecture = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0.0")
    status = Column(String(50), default="demo")  # available, demo, uninitialized
    mode = Column(String(50), default="DEMO")  # REAL_MODEL, RULE_ENGINE, DEMO
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
