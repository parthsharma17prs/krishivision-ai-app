# KrishiVision AI — Real-Time Asynchronous Vision Pipeline

## 1. Pipeline Design Goals

Traditional naive computer vision loops perform capture and inference synchronously:
```python
# Naive approach (DON'T DO THIS)
while True:
    frame = cap.read()       # Blocks on camera hardware
    result = model.infer(frame) # Blocks camera capture for 60-150ms!
```
This naive design leads to:
1. **Camera Frame Drops & Buffer Lag**: The video feed falls behind real time by multiple seconds.
2. **Choppy Streaming**: Video capture FPS drops to match the inference speed (e.g., 8-15 FPS instead of 30 FPS).
3. **Stale Predictions**: By the time inference finishes, the real-world leaf position has changed.

---

## 2. Decoupled Multi-Threaded Solution

KrishiVision Edge implements a **fully decoupled producer-consumer architecture**:

```
[ Hardware Camera ]
       │
       ▼
 ┌────────────────────────────────────────┐
 │   CameraCaptureThread (Producer)       │
 │   - Native 30 FPS capture rate         │
 │   - Bounded Queue (maxsize=2)          │
 │   - Stale-frame Drop Policy            │
 └──────────────────┬─────────────────────┘
                    │
                    ▼
 ┌────────────────────────────────────────┐
 │   EdgeProcessingThread (Consumer)      │
 │   - Frame-skip controller (skip=3)     │
 │   - Non-blocking queue read (0.1s)     │
 │   - MobileNetV2 ONNX Inference         │
 │   - Low-overhead contour leaf ROI      │
 └──────────────────┬─────────────────────┘
                    │
                    ▼
        [ WebSockets / Broadcast ]
```

### 2.1 Bounded Queue & Stale-Frame Dropping
The camera pipeline pushes frames into a thread-safe Python `queue.Queue` with `maxsize=2`.
If the queue is full (because an inference step is running), the producer pops the oldest frame and enqueues the newest frame, incrementing `total_dropped`.

**Result**: The consumer **always processes the most recent frame**. The pipeline has zero backlog latency.

### 2.2 Frame Skipping Controller
On edge hardware with limited compute (such as a Raspberry Pi or battery-powered gateway), inference is not required on all 30 frames per second:
- `frame_skip = 3`: Capture runs at ~30 FPS; full ONNX inference runs on 1 out of every 4 frames (~7.5 inferences per second).
- Intermediate frames receive cached predictions with smooth frame transitions and real-time HUD updates.

---

## 3. Thread-Safe State & Verification

All pipeline metrics are tracked by `FPSTracker`:
- `capture_fps`: Rolling window capture rate calculated from exact frame timestamps.
- `inference_fps`: Rolling window inference rate.
- `p50_latency_ms` & `p95_latency_ms`: Measured via `time.perf_counter()` from tensor entry to logits.
- **Zero Fabrication**: If camera capture is 0 FPS, the system reports 0.0 FPS. Metrics are never synthetic or hardcoded.
