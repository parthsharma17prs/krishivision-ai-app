#!/usr/bin/env python3
"""
KrishiVision AI — Live Google Sheets Telemetry Sync Worker
Polls public Google Sheet every 5 seconds and updates backend DB.
Spreadsheet: https://docs.google.com/spreadsheets/d/1NqyKaMTO9777tPJL_sjxJVxJocgogj0eby3a3Wqd6RQ/edit?gid=0#gid=0
"""

import os
import sys
import time
from datetime import datetime

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.db.session import engine, Base, SessionLocal
from app.services.google_sheets_sync import (
    fetch_latest_google_sheet_telemetry,
    sync_google_sheets_to_db,
    SPREADSHEET_ID
)

def run_live_sync(interval_seconds: int = 5):
    print("==================================================================")
    print("  🌾 KrishiVision AI — Live Google Sheets Telemetry Sync Worker  ")
    print(f"  Spreadsheet ID: {SPREADSHEET_ID}")
    print(f"  Polling Interval: Every {interval_seconds} Seconds")
    print("==================================================================")

    # Ensure DB tables exist
    Base.metadata.create_all(bind=engine)

    while True:
        db = SessionLocal()
        try:
            telemetry = fetch_latest_google_sheet_telemetry()
            reading = sync_google_sheets_to_db(db, field_id="field-indore-1")
            
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp_str}] 🟢 LIVE SYNC OK -> Temp: {reading.temperature_c}°C | Moisture: {reading.soil_moisture_pct}% | Tank: {reading.water_tank_pct}% | DB ID: {str(reading.id)[:8]}")
        except Exception as exc:
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp_str}] ⚠️ SYNC WARN: {str(exc)}")
        finally:
            db.close()

        time.sleep(interval_seconds)

if __name__ == "__main__":
    interval = 5
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        interval = int(sys.argv[1])
    run_live_sync(interval_seconds=interval)
