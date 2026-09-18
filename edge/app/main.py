import os
import time
import json
import asyncio
import threading
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np

from edge.app.config.settings import edge_settings
from edge.app.camera import CameraPipeline
from edge.app.inference import OnnxDiseaseClassifier, EdgePestDetector
from edge.app.sensors import get_sensor_provider, PhysicalSensorSimulator
from edge.app.decision import EdgeDecisionEngine, FarmDecision
from edge.app.storage import EdgeDatabase
from edge.app.sync import SyncWorker
from edge.app.streaming import annotate_edge_frame, encode_frame_to_base64_jpeg

# Global Edge State Container
class EdgeRuntimeState:
    def __init__(self):
        self.db: Optional[EdgeDatabase] = None
        self.camera: Optional[CameraPipeline] = None
        self.disease_engine: Optional[OnnxDiseaseClassifier] = None
        self.pest_engine: Optional[EdgePestDetector] = None
        self.sensor_provider = None
        self.decision_engine: Optional[EdgeDecisionEngine] = None
        self.sync_worker: Optional[SyncWorker] = None

        self.worker_thread: Optional[threading.Thread] = None
        self.running = False
        self.start_time = time.time()

        # Latest cached evaluation state
        self.lock = threading.Lock()
        self.latest_frame: Optional[np.ndarray] = None
        self.latest_annotated_frame_b64: str = ""
        self.latest_disease_res: Dict[str, Any] = {}
        self.latest_pest_res: Dict[str, Any] = {}
        self.latest_sensor_reading = None
        self.latest_decision: Optional[FarmDecision] = None
        self.active_websockets: List[WebSocket] = []

runtime = EdgeRuntimeState()

def edge_processing_worker():
    """
    Dedicated background thread continuously processing frames from decoupled camera queue,
    running local ONNX inference, polling sensors, synthesizing decisions, and caching for broadcast.
    """
    frame_counter = 0
    last_db_persist_time = 0.0

    while runtime.running:
        try:
            # 1. Read latest captured frame from decoupled non-blocking queue
            frame_tuple = runtime.camera.read(timeout=0.1)
            if frame_tuple is None:
                time.sleep(0.01)
                continue

            frame, cap_timestamp = frame_tuple
            frame_counter += 1

            # 2. Check if this frame should undergo full ML inference (frame_skip)
            skip = edge_settings.camera.frame_skip
            should_infer = (frame_counter % (skip + 1) == 0)

            if should_infer:
                # Run Local MobileNetV2 ONNX Inference
                t0 = time.perf_counter()
                disease_res = runtime.disease_engine.infer(frame)
                lat_ms = (time.perf_counter() - t0) * 1000.0
                runtime.camera.fps_tracker.record_inference(lat_ms)

                # Run Pest Detection (real model or honest MODEL_NOT_AVAILABLE / DEMO)
                pest_res = runtime.pest_engine.infer(frame)

                # Poll Edge Sensors
                sensor = runtime.sensor_provider.read()

                # Synthesize Autonomous On-Device Farm Decision
                decision = runtime.decision_engine.evaluate(sensor, disease_res, pest_res)

                # Annotate Frame HUD (leaf ROI, true FPS, offline indicator)
                fps_stats = runtime.camera.get_stats()
                annotated = annotate_edge_frame(
                    frame=frame,
                    disease_res=disease_res,
                    fps_stats=fps_stats,
                    sensor_reading=sensor,
                    offline_mode=True
                )
                b64_frame = encode_frame_to_base64_jpeg(annotated, quality=75)

                # Thread-safe state update
                with runtime.lock:
                    runtime.latest_frame = frame
                    runtime.latest_annotated_frame_b64 = b64_frame
                    runtime.latest_disease_res = disease_res
                    runtime.latest_pest_res = pest_res
                    runtime.latest_sensor_reading = sensor
                    runtime.latest_decision = decision

                # Persist to local SQLite periodically (every 5 seconds)
                now = time.time()
                if now - last_db_persist_time > 5.0:
                    runtime.db.save_sensor_reading(sensor, queue_sync=True)
                    runtime.db.save_inference_event(disease_res, queue_sync=True)
                    runtime.db.save_farm_decision(decision, queue_sync=True)
                    last_db_persist_time = now

            else:
                # Skip inference: just update the frame with cached detections
                time.sleep(0.005)

        except Exception as e:
            time.sleep(0.05)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    runtime.db = EdgeDatabase(edge_settings.storage.db_path)
    runtime.camera = CameraPipeline(
        source=edge_settings.camera.source,
        width=edge_settings.camera.width,
        height=edge_settings.camera.height,
        target_capture_fps=edge_settings.camera.target_capture_fps
    )
    runtime.camera.start()

    runtime.disease_engine = OnnxDiseaseClassifier(
        model_path=edge_settings.models.disease_model_path,
        config_path=edge_settings.models.disease_config_path,
        db_path=edge_settings.models.disease_db_path,
        confidence_threshold=edge_settings.camera.confidence_threshold,
        enable_cuda=edge_settings.models.enable_cuda
    )
    # Warmup inference
    dummy = np.zeros((480, 640, 3), dtype=np.uint8)
    runtime.disease_engine.warmup(dummy)

    runtime.pest_engine = EdgePestDetector(
        model_path=edge_settings.models.pest_model_path,
        demo_mode=False
    )

    runtime.sensor_provider = get_sensor_provider(edge_settings.sensors.provider)
    runtime.decision_engine = EdgeDecisionEngine(
        field_id=edge_settings.service.field_id,
        farm_id=edge_settings.service.farm_id
    )

    runtime.sync_worker = SyncWorker(
        db=runtime.db,
        cloud_url=edge_settings.sync.cloud_backend_url,
        sync_interval=edge_settings.sync.sync_interval_seconds,
        batch_size=edge_settings.sync.batch_size
    )
    runtime.sync_worker.start()

    # Start Edge Processing Worker Thread
    runtime.running = True
    runtime.worker_thread = threading.Thread(target=edge_processing_worker, daemon=True, name="EdgeProcessingThread")
    runtime.worker_thread.start()

    yield

    # Shutdown Sequence
    runtime.running = False
    if runtime.worker_thread and runtime.worker_thread.is_alive():
        runtime.worker_thread.join(timeout=2.0)
    if runtime.camera:
        runtime.camera.stop()
    if runtime.sync_worker:
        runtime.sync_worker.stop()

# Initialize FastAPI Edge Application
app = FastAPI(
    title="KrishiVision AI — Autonomous Edge Node",
    description="Field-deployable, 100% offline-capable Edge AI runtime for smart agriculture.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HTTP REST Endpoints ----------------- #

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": edge_settings.service.name,
        "mode": "100%_OFFLINE_CAPABLE",
        "timestamp": time.time()
    }

@app.get("/ready")
def ready():
    models_ready = (runtime.disease_engine is not None and runtime.disease_engine.is_loaded)
    cam_ready = (runtime.camera is not None and runtime.camera.is_running)
    return {
        "ready": models_ready and cam_ready,
        "models_loaded": models_ready,
        "camera_active": cam_ready
    }

@app.get("/api/v1/edge/status")
def get_edge_status():
    """Returns complete real-time runtime health, measured performance, and offline sync metrics."""
    fps_stats = runtime.camera.get_stats() if runtime.camera else {}
    sync_stats = runtime.sync_worker.get_status() if runtime.sync_worker else {}
    storage_stats = runtime.db.get_storage_stats() if runtime.db else {}
    disease_health = runtime.disease_engine.health() if runtime.disease_engine else {}
    pest_health = runtime.pest_engine.health() if runtime.pest_engine else {}
    sensor_health = runtime.sensor_provider.health() if runtime.sensor_provider else {}

    return {
        "node_info": {
            "name": edge_settings.service.name,
            "device_profile": edge_settings.device_profile,
            "field_id": edge_settings.service.field_id,
            "farm_id": edge_settings.service.farm_id,
            "uptime_seconds": round(time.time() - runtime.start_time, 1),
            "offline_mode_ready": True
        },
        "performance": fps_stats,
        "models": {
            "disease": disease_health,
            "pest": pest_health
        },
        "sensors": sensor_health,
        "storage": storage_stats,
        "sync": sync_stats
    }

@app.get("/metrics")
def get_prometheus_metrics():
    """Returns verifiable JSON metrics for operational monitoring."""
    fps_stats = runtime.camera.get_stats() if runtime.camera else {}
    sync_stats = runtime.sync_worker.get_status() if runtime.sync_worker else {}
    sensor = runtime.latest_sensor_reading

    return {
        "krishivision_edge_capture_fps": fps_stats.get("capture_fps", 0.0),
        "krishivision_edge_inference_fps": fps_stats.get("inference_fps", 0.0),
        "krishivision_edge_inference_latency_avg_ms": fps_stats.get("avg_latency_ms", 0.0),
        "krishivision_edge_inference_latency_p50_ms": fps_stats.get("p50_latency_ms", 0.0),
        "krishivision_edge_inference_latency_p95_ms": fps_stats.get("p95_latency_ms", 0.0),
        "krishivision_edge_soil_moisture_pct": sensor.soil_moisture_pct if sensor else None,
        "krishivision_edge_temperature_c": sensor.temperature_c if sensor else None,
        "krishivision_edge_humidity_pct": sensor.humidity_pct if sensor else None,
        "krishivision_edge_pending_sync_items": sync_stats.get("pending_sync_items", 0),
        "krishivision_edge_total_items_synced": sync_stats.get("total_items_synced", 0)
    }

@app.get("/api/v1/edge/latest-decision")
def get_latest_decision():
    """Returns the most recent autonomous decision evaluated on-device."""
    with runtime.lock:
        if runtime.latest_decision:
            return runtime.latest_decision.model_dump()
    # Fallback to local DB
    db_dec = runtime.db.get_latest_decision()
    if db_dec:
        return db_dec
    raise HTTPException(status_code=404, detail="No farm decision evaluated yet.")

@app.get("/api/v1/edge/sensors")
def get_sensors():
    """Returns active sensor state, bounds validation, and multimodal nutrient transparency."""
    with runtime.lock:
        reading = runtime.latest_sensor_reading
    if not reading and runtime.sensor_provider:
        reading = runtime.sensor_provider.read()
    if reading:
        return reading.model_dump()
    return {"status": "NO_READINGS_YET"}

@app.post("/api/v1/edge/sensors/scenario")
def set_simulator_scenario(payload: Dict[str, str]):
    """Switches the sensor simulator scenario (e.g. DROUGHT, HEATWAVE, WATERLOGGED_FLOOD, FUNGAL_RISK)."""
    scenario = payload.get("scenario", "OPTIMAL")
    if isinstance(runtime.sensor_provider, PhysicalSensorSimulator):
        success = runtime.sensor_provider.set_scenario(scenario)
        if success:
            return {"success": True, "active_scenario": scenario}
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Choices: {list(PhysicalSensorSimulator.SCENARIOS.keys())}")
    return {"success": False, "message": "Sensor provider is hardware, not simulator."}

@app.post("/api/v1/edge/pest/demo-mode")
def set_pest_demo_mode(payload: Dict[str, bool]):
    """Toggles simulated demo mode for pest detection."""
    enabled = payload.get("enabled", False)
    if runtime.pest_engine:
        runtime.pest_engine.demo_mode = enabled
        return {"success": True, "demo_mode": enabled, "status": runtime.pest_engine.health()["status"]}
    return {"success": False, "message": "Pest engine uninitialized."}

@app.post("/api/v1/edge/inference/manual")
async def manual_inference(file: UploadFile = File(...)):
    """Accepts leaf image upload for on-demand local ONNX classification."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format.")

        res = runtime.disease_engine.infer(img)
        # Log to local DB
        if runtime.db:
            runtime.db.save_inference_event(res, queue_sync=True)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Real-Time Live WebSocket ----------------- #

@app.websocket("/ws/edge/live")
async def websocket_edge_live(websocket: WebSocket):
    """
    High-speed streaming WebSocket delivering:
    - Annotated video frame (base64 JPEG)
    - Measured capture FPS & p95 latency
    - Active visual disease diagnosis
    - Sensor readings & bounds validation
    - On-device decision & action directives
    """
    await websocket.accept()
    runtime.active_websockets.append(websocket)

    try:
        while True:
            # Package latest edge state
            with runtime.lock:
                frame_b64 = runtime.latest_annotated_frame_b64
                disease_res = runtime.latest_disease_res
                pest_res = runtime.latest_pest_res
                sensor = runtime.latest_sensor_reading
                decision = runtime.latest_decision

            fps_stats = runtime.camera.get_stats() if runtime.camera else {}

            packet = {
                "timestamp": time.time(),
                "node_name": edge_settings.service.name,
                "frame_b64": frame_b64,
                "performance": fps_stats,
                "disease": disease_res,
                "pest": pest_res,
                "sensors": sensor.model_dump() if sensor else None,
                "decision": decision.model_dump() if decision else None,
                "offline_guarantee": "ZERO_CLOUD_ROUNDTRIP_LOCAL_EDGE"
            }

            await websocket.send_text(json.dumps(packet))
            # Stream at ~10 FPS over WebSocket for low network overhead
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        if websocket in runtime.active_websockets:
            runtime.active_websockets.remove(websocket)
    except Exception:
        if websocket in runtime.active_websockets:
            runtime.active_websockets.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("edge.app.main:app", host=edge_settings.service.host, port=edge_settings.service.port, reload=False)
