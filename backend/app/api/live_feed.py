from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from app.services.live_feed_service import live_feed_service

router = APIRouter(prefix="/live-feed", tags=["Live Image Feed & Drive Ingestion"])

@router.get("/status")
def get_live_feed_status():
    """Returns Google Drive connection status, polling interval, and total items processed."""
    return live_feed_service.get_status()

@router.get("/stats")
def get_live_feed_stats():
    """Returns dashboard analytics: disease histogram, severity distribution, timeline trend."""
    return live_feed_service.get_stats()

@router.get("/records")
def get_live_feed_records(
    crop: Optional[str] = Query(None, description="Filter by crop name or 'all'"),
    severity: Optional[str] = Query(None, description="Filter by severity or 'all'"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return")
):
    """Returns historical list of Drive scanned images with full ML diagnoses."""
    return live_feed_service.get_records(crop=crop, severity=severity, limit=limit)

@router.get("/latest")
def get_latest_live_feed():
    """Returns the single latest scanned field image and ML diagnosis."""
    latest = live_feed_service.get_latest_record()
    if not latest:
        # Trigger an immediate poll if no records exist
        live_feed_service.poll_once()
        latest = live_feed_service.get_latest_record()
    return latest or {}

@router.post("/poll-now")
def trigger_drive_poll():
    """Triggers an immediate single polling check of Google Drive for new images."""
    new_records = live_feed_service.poll_once()
    return {
        "success": True,
        "processed_count": len(new_records),
        "new_records": new_records,
        "status": live_feed_service.get_status()
    }

@router.post("/toggle")
def toggle_auto_polling(active: Optional[bool] = None):
    """Toggles continuous 10-second polling on or off."""
    new_state = live_feed_service.toggle_polling(active)
    return {
        "success": True,
        "is_polling_active": new_state
    }

@router.post("/simulate-capture")
def simulate_camera_capture(sample: Optional[str] = Query(None, description="Optional sample type e.g. 'potato', 'apple', 'tomato', 'corn'")):
    """Simulates an incoming Agribot field camera image capture processed through PlantDoctor."""
    record = live_feed_service.simulate_capture(sample)
    return {
        "success": True,
        "record": record,
        "stats": live_feed_service.get_stats()
    }

from fastapi import UploadFile, File

@router.post("/upload-capture")
async def upload_live_camera_capture(file: UploadFile = File(...)):
    """Ingests and diagnoses an image captured live from the dashboard camera / webcam."""
    contents = await file.read()
    filename = file.filename or "webcam_capture.jpg"
    record = live_feed_service.ingest_uploaded_image(contents, filename)
    return {
        "success": True,
        "record": record,
        "stats": live_feed_service.get_stats()
    }

@router.post("/reload-history")
def reload_feed_history():
    """Reloads history from storage to reflect recent prunes or updates."""
    live_feed_service.reload_history()
    return {
        "success": True,
        "status": live_feed_service.get_status()
    }

@router.post("/trigger-stuck-simulation")
def trigger_stuck_simulation():
    """Inserts 5 duplicate frame sequences to simulate Agri Bot stuck rover condition."""
    stuck_records = live_feed_service.insert_stuck_rover_duplicate_frames()
    return {
        "success": True,
        "inserted_count": len(stuck_records),
        "status": live_feed_service.get_status()
    }

import os
import subprocess

@router.post("/trigger-emergency-call")
def trigger_emergency_ai_call():
    """Executes calltwo-master node script to initiate outbound Twilio + Ultravox AI voice call to farmer."""
    calltwo_dir = "/Users/macbook/Downloads/calltwo-master"
    script_path = os.path.join(calltwo_dir, "index.js")

    if not os.path.exists(script_path):
        return {
            "success": False,
            "error": f"calltwo-master script not found at {script_path}"
        }

    try:
        proc = subprocess.Popen(
            ["node", script_path],
            cwd=calltwo_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return {
            "success": True,
            "message": "Outbound Agri Bot Voice AI call initiated to farmer (+918319556016) via calltwo-master (Ultravox + Twilio)!",
            "pid": proc.pid,
            "destination": "+918319556016",
            "bot_identity": "Agri Bot Field Support"
        }
    except Exception as exc:
        return {
            "success": False,
            "error": f"Failed to execute calltwo-master: {str(exc)}"
        }

