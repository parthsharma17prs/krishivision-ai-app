import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Farm, SensorReading, PlantScan, Report
from app.schemas.schemas import ReportOut
from app.services.report_generator import report_generator
from app.core.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix="/reports", tags=["Diagnostic Reports"])

@router.post("", response_model=ReportOut)
def generate_report(farm_id: str = "farm-indore-001", db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    farm_name = farm.name if farm else "Farm 01 — Indore"
    location = farm.location if farm else "Indore, Madhya Pradesh"
    crop = farm.main_crop if farm else "Tomato"

    sr = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    moisture = sr.soil_moisture_pct if sr else 28.0

    upload_dir = settings.UPLOAD_DIR
    reports_dir = os.path.join(upload_dir, "reports")

    filename = report_generator.generate_diagnostic_report(
        farm_name=farm_name,
        location=location,
        crop_name=crop,
        disease_name="Tomato Early Blight",
        confidence_pct=91.4,
        severity="Moderate",
        soil_moisture_pct=moisture,
        irrigation_recommendation="Irrigation recommended within 4 hours",
        output_dir=reports_dir
    )

    report_id = f"rpt-{int(datetime.now(timezone.utc).timestamp())}"
    file_path = os.path.join(reports_dir, filename)
    download_url = f"/api/reports/{report_id}/download"

    report_obj = Report(
        id=report_id,
        farm_id=farm_id,
        report_type="Farm Diagnostic & Irrigation Report",
        title=f"Diagnostic Report — {filename}",
        file_path=file_path,
        download_url=download_url
    )
    db.add(report_obj)
    db.commit()
    db.refresh(report_obj)
    return report_obj

@router.get("/{report_id}", response_model=ReportOut)
def get_report_details(report_id: str, db: Session = Depends(get_db)):
    rpt = db.query(Report).filter(Report.id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found.")
    return rpt

@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    rpt = db.query(Report).filter(Report.id == report_id).first()
    if not rpt or not os.path.exists(rpt.file_path):
        # Generate on-the-fly if not found
        upload_dir = settings.UPLOAD_DIR
        reports_dir = os.path.join(upload_dir, "reports")
        filename = report_generator.generate_diagnostic_report(output_dir=reports_dir)
        file_path = os.path.join(reports_dir, filename)
        return FileResponse(file_path, filename=filename, media_type="application/pdf")
    
    return FileResponse(rpt.file_path, filename=os.path.basename(rpt.file_path), media_type="application/pdf")
