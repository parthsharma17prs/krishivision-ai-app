import os
import sys
import time
import pytest
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from edge.app.camera.fps_tracker import FPSTracker
from edge.app.camera.capture import CameraPipeline
from edge.app.inference.disease import OnnxDiseaseClassifier
from edge.app.inference.pest import EdgePestDetector
from edge.app.sensors.base import SensorReading
from edge.app.sensors.simulator import PhysicalSensorSimulator
from edge.app.decision.irrigation import IrrigationDecisionModel
from edge.app.decision.risks import ClimateRiskEngine
from edge.app.decision.nutrient import MultimodalNutrientEngine
from edge.app.decision.engine import EdgeDecisionEngine
from edge.app.storage.db import EdgeDatabase

# 1. FPS Tracker Verification
def test_fps_tracker():
    tracker = FPSTracker(window_size=30)
    for _ in range(10):
        tracker.record_capture()
        tracker.record_inference(latency_ms=25.0)
        time.sleep(0.01)

    metrics = tracker.get_metrics()
    assert metrics["total_captured"] == 10
    assert metrics["total_inferred"] == 10
    assert metrics["capture_fps"] > 0.0
    assert metrics["latency_avg_ms"] > 0.0
    assert metrics["latency_p95_ms"] > 0.0

# 2. Camera Pipeline Fallback
def test_camera_pipeline_synthetic_fallback():
    # Pass an invalid device index to ensure it falls back gracefully to synthetic test pattern
    cam = CameraPipeline(source=999, width=320, height=240, target_capture_fps=30.0, queue_size=2)
    cam.start()
    time.sleep(0.3)
    frame_tuple = cam.read(timeout=1.0)
    assert frame_tuple is not None
    frame, timestamp = frame_tuple
    assert frame.shape == (240, 320, 3)
    cam.stop()

# 3. ONNX Disease Classifier
def test_onnx_disease_classifier():
    clf = OnnxDiseaseClassifier()
    assert clf.is_loaded is True
    assert clf.execution_provider in ["CPUExecutionProvider", "CUDAExecutionProvider"]

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = clf.infer(dummy_frame)

    assert "status" in res
    assert "latency_ms" in res
    assert res["latency_ms"] > 0.0
    assert "crop" in res
    assert "leaf_roi" in res
    assert len(res["leaf_roi"]) == 4

# 4. Pest Detector Honesty
def test_pest_detector_honesty():
    # Real mode without weights mounted must honestly report MODEL_NOT_AVAILABLE
    detector_real = EdgePestDetector(model_path="non_existent_weights.onnx", demo_mode=False)
    assert detector_real.is_loaded is False

    dummy = np.zeros((480, 640, 3), dtype=np.uint8)
    res_real = detector_real.infer(dummy)
    assert res_real["status"] == "MODEL_NOT_AVAILABLE"
    assert res_real["available"] is False
    assert len(res_real["detections"]) == 0

    # Demo mode when explicitly activated
    detector_demo = EdgePestDetector(demo_mode=True)
    res_demo = detector_demo.infer(dummy)
    assert res_demo["status"] == "SIMULATED_DEMO"
    assert res_demo["simulated"] is True
    assert len(res_demo["detections"]) > 0

# 5. Sensor Simulator & Anomaly Bounds
def test_sensors_and_anomaly_detection():
    sim = PhysicalSensorSimulator(initial_scenario="OPTIMAL")
    opt = sim.read()
    assert opt.is_valid is True
    assert len(opt.anomaly_flags) == 0
    assert 10.0 <= opt.temperature_c <= 45.0

    # Test Anomaly Scenario
    sim.set_scenario("SENSOR_FAULT")
    fault = sim.read()
    assert fault.is_valid is False
    assert len(fault.anomaly_flags) > 0

# 6. Multimodal Nutrient Scientific Honesty
def test_multimodal_nutrient_scientific_honesty():
    engine = MultimodalNutrientEngine()

    # Case A: RGB Only
    sensor_rgb = SensorReading(source="edge_camera", chemical_npk_available=False)
    disease_res = {"detected": True, "disease_name": "Tomato Yellow Leaf Curl Virus", "is_healthy": False}
    assessment_rgb = engine.evaluate(sensor_rgb, disease_res)

    assert assessment_rgb["chemical_sensor_attached"] is False
    assert assessment_rgb["soil_chemistry"]["nitrogen_ppm"] == "DATA_REQUIRED"
    assert "DATA_REQUIRED" in str(assessment_rgb["soil_chemistry"])
    assert "scientific_honesty_note" in assessment_rgb

    # Case B: Chemical Sensor Connected
    sensor_chem = SensorReading(
        source="soil_probe",
        chemical_npk_available=True,
        nitrogen_ppm=14.0,
        phosphorus_ppm=22.0,
        potassium_ppm=180.0
    )
    assessment_chem = engine.evaluate(sensor_chem, disease_res)
    assert assessment_chem["chemical_sensor_attached"] is True
    assert assessment_chem["soil_chemistry"]["nitrogen_status"] == "DEFICIENT"
    assert len(assessment_chem["prescriptions"]) > 0

# 7. Decision Engine Synthesis
def test_decision_engine_synthesis():
    engine = EdgeDecisionEngine()
    sim = PhysicalSensorSimulator()

    # Scenario 1: Drought
    sim.set_scenario("DROUGHT")
    sensor = sim.read()
    dec = engine.evaluate(sensor, {"detected": False, "status": "CONFIRMED"})
    assert dec.primary_action in ["EMERGENCY_DRIP_IRRIGATION", "CRITICAL_STORAGE_DEPLETION_ALERT"]
    assert dec.urgency in ["HIGH", "CRITICAL"]
    assert any("SOIL_MOISTURE" in code or "DROUGHT" in code for code in dec.evidence_codes)

    # Scenario 2: Flood
    sim.set_scenario("WATERLOGGED_FLOOD")
    sensor = sim.read()
    dec_flood = engine.evaluate(sensor, {"detected": False, "status": "CONFIRMED"})
    assert dec_flood.primary_action == "EMERGENCY_FLOOD_DRAINAGE"
    assert dec_flood.urgency in ["HIGH", "CRITICAL"]

# 8. Local SQLite Storage & Sync Queue
def test_edge_storage_and_sync_queue(tmp_path):
    db_file = str(tmp_path / "test_edge.db")
    db = EdgeDatabase(db_file)

    # Save reading
    r = SensorReading(source="unit_test", temperature_c=28.0, humidity_pct=65.0, soil_moisture_pct=50.0)
    rid = db.save_sensor_reading(r, queue_sync=True)
    assert rid > 0

    # Verify queue
    pending = db.get_pending_sync_items(limit=10)
    assert len(pending) == 1
    assert pending[0]["entity_type"] == "sensor_reading"

    # Mark synced
    db.mark_items_synced([pending[0]["queue_id"]])
    assert len(db.get_pending_sync_items()) == 0

    stats = db.get_storage_stats()
    assert stats["total_sensor_readings"] == 1
    assert stats["synced_items"] == 1
