import os
import sys
from datetime import datetime, timezone, timedelta

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.db.session import engine, SessionLocal, Base
from app.models.models import User, Farm, Field, CropCycle, SensorReading, Alert, ModelVersion
from app.core.security import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Demo User
        user = db.query(User).filter(User.email == "farmer@demo.local").first()
        if not user:
            user = User(
                id="user-demo-id",
                email="farmer@demo.local",
                hashed_password=get_password_hash("Demo@123"),
                full_name="Rajesh Patel",
                role="farmer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("[INFO] Created demo user: farmer@demo.local / Demo@123")
        else:
            print("[INFO] Demo user exists.")

        # 2. Create Demo Farm
        farm = db.query(Farm).filter(Farm.id == "farm-indore-001").first()
        if not farm:
            farm = Farm(
                id="farm-indore-001",
                user_id=user.id,
                name="Farm 01 — Indore",
                location="Indore, Madhya Pradesh",
                state="Madhya Pradesh",
                district="Indore",
                total_area_acres=5.0,
                main_crop="Tomato",
                health_score=82
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)
            print("[INFO] Created demo farm: Farm 01 — Indore (5.0 acres)")
        else:
            print("[INFO] Demo farm exists.")

        # 3. Create Field
        field = db.query(Field).filter(Field.id == "field-indore-1").first()
        if not field:
            field = Field(
                id="field-indore-1",
                farm_id=farm.id,
                name="Field A - North Plot",
                area_acres=2.5,
                soil_type="Black Soil (Regur)",
                irrigation_type="Drip Irrigation"
            )
            db.add(field)
            db.commit()
            db.refresh(field)
            print("[INFO] Created demo field: Field A - North Plot")
        else:
            print("[INFO] Demo field exists.")

        # 4. Create Crop Cycle
        cycle = db.query(CropCycle).filter(CropCycle.id == "cycle-indore-1").first()
        if not cycle:
            cycle = CropCycle(
                id="cycle-indore-1",
                field_id=field.id,
                crop_name="Tomato",
                variety="Solanum lycopersicum (Pusa Ruby)",
                sowing_date=datetime.now(timezone.utc) - timedelta(days=45),
                growth_stage="Flowering & Fruit Setting",
                status="Active"
            )
            db.add(cycle)
            db.commit()
            db.refresh(cycle)
            print("[INFO] Created demo crop cycle: Tomato (Flowering stage)")
        else:
            print("[INFO] Demo crop cycle exists.")

        # 5. Populate Telemetry Sensor Readings
        existing_readings = db.query(SensorReading).filter(SensorReading.field_id == field.id).count()
        if existing_readings == 0:
            now = datetime.now(timezone.utc)
            for i in range(12):
                t = now - timedelta(hours=i*2)
                sr = SensorReading(
                    id=f"sr-seed-{i}",
                    field_id=field.id,
                    soil_moisture_pct=26.0 + (i % 5) * 1.2,
                    temperature_c=31.0 + (i % 4) * 0.8,
                    humidity_pct=52.0 + (i % 6) * 1.5,
                    water_tank_pct=75.0 - (i % 3) * 2.0,
                    timestamp=t
                )
                db.add(sr)
            db.commit()
            print("[INFO] Seeded 12 sensor telemetry historical readings.")

        # 6. Populate Alerts
        existing_alerts = db.query(Alert).filter(Alert.farm_id == farm.id).count()
        if existing_alerts == 0:
            alert1 = Alert(
                farm_id=farm.id,
                alert_type="WEATHER",
                title="Heat Stress Alert",
                message="Ambient temperature expected to reach 34°C. Irrigate during early morning or evening.",
                severity="WARNING"
            )
            alert2 = Alert(
                farm_id=farm.id,
                alert_type="IRRIGATION",
                title="Irrigation Window Recommended",
                message="Soil moisture at 28.0%. Recommended irrigation window within 4 hours.",
                severity="INFO"
            )
            db.add_all([alert1, alert2])
            db.commit()
            print("[INFO] Seeded farm alerts.")

        print("[SUCCESS] Demo data seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
