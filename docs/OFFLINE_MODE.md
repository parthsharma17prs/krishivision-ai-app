# KrishiVision AI — Offline-First Architecture & Verification Guide

## 1. Zero-Cloud Resilience Philosophy

In remote agricultural fields, continuous cloud connectivity cannot be assumed. KrishiVision AI is built from the ground up on the **Offline-First Principle**:

1. **Inference is 100% Local**: The MobileNetV2 ONNX model is stored on the edge device and executed on local CPU/GPU execution providers.
2. **Decisions are 100% Local**: The multi-engine decision tree runs on-device using local sensor inputs and local computer vision outputs.
3. **Storage is 100% Local**: All sensor telemetry, inference outputs, and autonomous farm directives are persisted to an embedded SQLite database (`edge/edge.db`).
4. **Cloud Sync is Strictly Asynchronous**: If internet is lost, the edge node continues to operate with zero degradation. The `SyncWorker` queues all events and drains them when connectivity is restored.

---

## 2. Step-by-Step Offline Verification Procedure

Follow this empirical testing procedure to verify that KrishiVision Edge operates seamlessly when completely disconnected from the internet.

### Step 1: Start the Local Edge Daemon
```bash
# Activate virtual environment
source venv/bin/activate

# Launch the Edge node on port 8001
python -m edge.app.main
```
Expected output:
```
🚀 [CameraPipeline] Capture thread started.
📷 [CameraPipeline] Camera opened successfully on source: 0
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 2: Disconnect Network / Internet
- Disable Wi-Fi and unplug Ethernet cables on the edge host machine, OR
- Block internet access at the routing layer.

### Step 3: Verify Live Video and Inference
1. Open your browser to the **Edge AI Station**: `http://localhost:5173/edge`.
2. Notice the green **LOCAL EDGE AI [100% OFFLINE]** banner on the video canvas.
3. Observe:
   - **Capture FPS**: Continues smoothly at ~30 FPS.
   - **Inference Throughput**: Continues at 14.9 FPS.
   - **Inference Latency**: Continues to report measured ~52 ms p50 latency.
   - **Autonomous Decisions**: Real-time directives update immediately as camera frames change.

### Step 4: Verify Local Database Persistence
While offline, query the local embedded SQLite database:
```bash
python -c "
from edge.app.storage import EdgeDatabase
db = EdgeDatabase('edge/edge.db')
stats = db.get_storage_stats()
print('Local Records:', stats)
"
```
You will observe `pending_sync_items` increasing while `total_sensor_readings` and `total_farm_decisions` are stored safely on disk.

### Step 5: Reconnect Network & Verify Drain
1. Re-enable Wi-Fi or internet connectivity.
2. Ensure the cloud backend is running on `http://localhost:8000`:
   ```bash
   cd backend && python main.py
   ```
3. Observe the `SyncWorkerThread` logs:
   - Within 15 seconds (the default sync interval), `pending_sync_items` drains to 0.
   - The cloud backend registers the edge node and stores the synchronized decision batches.

---

## 3. Data Integrity & Sync Protocol

The local database guarantees ACID transactions and crash consistency:

- **Entity Types Synced**:
  - `sensor_reading`: Calibrated physical environmental readings.
  - `inference_event`: Model predictions, confidence scores, and bounding box ROIs.
  - `farm_decision`: High-level autonomous farm directives, reason codes, and actuator relay states.
- **Deduplication**: Every decision has a deterministic UUID (`decision_id`). Repeated sync attempts never cause duplicate records on the cloud server.
