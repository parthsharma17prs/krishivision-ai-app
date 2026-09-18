#!/usr/bin/env python3
"""
KrishiVision AI — ESP32 Telemetry Simulator Script
Simulates live sensor reading changes (Soil Moisture, Temperature, Water Tank)
every 10 seconds and updates backend DB & Google Sheets reader.
"""

import os
import sys
import time
import random
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.db.session import engine, Base, SessionLocal
from app.models.models import SensorReading

def simulate_esp32_stream(interval_seconds: int = 10):
    Base.metadata.create_all(bind=engine)
    print("==================================================================")
    print(" 📡 ESP32 Live Hardware Sensor Simulator Running")
    print(f" Simulating Live Telemetry Updates Every {interval_seconds} Seconds")
    print(" Target: Main UI Dashboard (http://localhost:5173/dashboard)")
    print("==================================================================")

    step = 0
    while True:
        step += 1
        db = SessionLocal()
        try:
            # Dynamic realistic values
            temp_c = round(31.5 + (step % 10) * 0.3 + random.uniform(-0.2, 0.2), 1)
            moist_pct = round(26.0 + (step % 12) * 0.8 + random.uniform(-0.5, 0.5), 1)
            tank_pct = round(72.0 - (step % 15) * 0.4, 1)

            reading = SensorReading(
                field_id="field-indore-1",
                soil_moisture_pct=moist_pct,
                temperature_c=temp_c,
                humidity_pct=round(54.0 + (temp_c % 4), 1),
                water_tank_pct=max(10.0, min(100.0, tank_pct)),
                timestamp=datetime.now(timezone.utc)
            )
            db.add(reading)
            db.commit()
            db.refresh(reading)

            t_str = datetime.now().strftime("%H:%M:%S")
            print(f"[{t_str}] ⚡ ESP32 STREAM #{step:03d} -> Temp: {temp_c}°C | Soil Moisture: {moist_pct}% | Water Tank: {tank_pct}%")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            db.close()

        time.sleep(interval_seconds)

if __name__ == "__main__":
    simulate_esp32_stream(10)
