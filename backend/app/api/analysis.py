import os
import shutil
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import DiseaseAnalysisResponse, PestAnalysisRequest, PestAnalysisResponse, NutrientAnalysisRequest, NutrientAnalysisResponse
from app.ml.disease_adapter import disease_adapter
from app.ml.pest_adapter import pest_adapter
from app.ml.nutrient_adapter import nutrient_adapter
from app.core.config import settings

router = APIRouter(prefix="/analysis", tags=["AI Analysis & Diagnostics"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/disease", response_model=DiseaseAnalysisResponse)
async def analyze_plant_disease(
    file: UploadFile = File(...),
    crop_name: str = Form("Tomato"),
    db: Session = Depends(get_db)
):
    # Security validation
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    # Save uploaded file safely
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    saved_filename = f"upload_{int(time.time())}_{filename}"
    file_path = os.path.join(upload_dir, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Execute ML / Adapter Inference
    res = disease_adapter.predict(file_path, output_dir=upload_dir)

    return {
        "scan_id": f"scan-{int(time.time())}",
        "crop_cycle_id": "cycle-indore-1",
        "detected_plant": crop_name or res["detected_plant"],
        "primary_disease": res["primary_disease"],
        "confidence_pct": res["confidence_pct"],
        "severity": res["severity"],
        "affected_area_pct": res["affected_area_pct"],
        "bounding_box_url": f"/uploads/{res['bounding_box_filename']}",
        "heatmap_url": f"/uploads/{res['heatmap_filename']}",
        "original_image_url": f"/uploads/{saved_filename}",
        "top_3_predictions": res["top_3_predictions"],
        "advisory_actions": res["advisory_actions"],
        "mode": res["mode"],
        "model_version": res["model_version"],
        "processing_time_ms": res["processing_time_ms"],
        "disclaimer": "AI advisory model. Verify critical crop diagnoses with an agricultural extension officer."
    }

@router.post("/pest", response_model=PestAnalysisResponse)
def analyze_pest(req: PestAnalysisRequest):
    res = pest_adapter.predict(crop_name=req.crop_name)
    return {
        "scan_id": f"pest-{int(time.time())}",
        "detected_pests": res["detected_pests"],
        "overall_severity": res["overall_severity"],
        "recommended_control": res["recommended_control"],
        "mode": res["mode"],
        "label_notice": res["label_notice"]
    }

@router.post("/nutrient", response_model=NutrientAnalysisResponse)
def analyze_nutrient(req: NutrientAnalysisRequest):
    res = nutrient_adapter.predict(
        crop_name=req.crop_name,
        growth_stage=req.growth_stage,
        soil_ph=req.soil_ph,
        npk_sensor=req.npk_sensor,
        symptoms=req.symptoms_observed
    )
    return {
        "field_id": req.field_id,
        "likely_deficiency": res["likely_deficiency"],
        "confidence_pct": res["confidence_pct"],
        "deficiency_breakdown": res["deficiency_breakdown"],
        "supporting_evidence": res["supporting_evidence"],
        "recommended_fertilizer_advisory": res["recommended_fertilizer_advisory"],
        "recommended_soil_test": res["recommended_soil_test"],
        "mode": res["mode"],
        "notice": res["notice"]
    }
