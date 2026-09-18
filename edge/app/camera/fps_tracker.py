import time
import threading
from collections import deque
from typing import Dict, Any, List
import numpy as np

class FPSTracker:
    """
    Thread-safe, verifiable FPS and latency tracker.
    Computes actual rolling capture FPS, inference FPS, and latency percentiles (p50, p95).
    Never fabricates metrics.
    """

    def __init__(self, window_size: int = 50):
        self.window_size = window_size
        self._lock = threading.Lock()

        # Timestamps of captured frames
        self._capture_times = deque(maxlen=window_size)
        # Timestamps of finished inferences
        self._inference_times = deque(maxlen=window_size)
        # Latencies in milliseconds (from queue entry to inference completion)
        self._latencies_ms = deque(maxlen=window_size)

        # Counters
        self.total_captured = 0
        self.total_inferred = 0
        self.total_dropped = 0
        self.start_time = time.time()

    def record_capture(self):
        with self._lock:
            now = time.time()
            self._capture_times.append(now)
            self.total_captured += 1

    def record_drop(self):
        with self._lock:
            self.total_dropped += 1

    def record_inference(self, latency_ms: float):
        with self._lock:
            now = time.time()
            self._inference_times.append(now)
            self._latencies_ms.append(latency_ms)
            self.total_inferred += 1

    def _calc_fps(self, times_deque: deque) -> float:
        if len(times_deque) < 2:
            return 0.0
        elapsed = times_deque[-1] - times_deque[0]
        if elapsed <= 0:
            return 0.0
        return round((len(times_deque) - 1) / elapsed, 2)

    def get_metrics(self) -> Dict[str, Any]:
        with self._lock:
            capture_fps = self._calc_fps(self._capture_times)
            inference_fps = self._calc_fps(self._inference_times)

            if len(self._latencies_ms) > 0:
                lats = list(self._latencies_ms)
                avg_latency = round(float(np.mean(lats)), 2)
                p50_latency = round(float(np.percentile(lats, 50)), 2)
                p95_latency = round(float(np.percentile(lats, 95)), 2)
                min_latency = round(float(np.min(lats)), 2)
                max_latency = round(float(np.max(lats)), 2)
            else:
                avg_latency = 0.0
                p50_latency = 0.0
                p95_latency = 0.0
                min_latency = 0.0
                max_latency = 0.0

            uptime_seconds = round(time.time() - self.start_time, 1)

            return {
                "capture_fps": capture_fps,
                "inference_fps": inference_fps,
                "latency_avg_ms": avg_latency,
                "latency_p50_ms": p50_latency,
                "latency_p95_ms": p95_latency,
                "latency_min_ms": min_latency,
                "latency_max_ms": max_latency,
                "total_captured": self.total_captured,
                "total_inferred": self.total_inferred,
                "total_dropped": self.total_dropped,
                "uptime_seconds": uptime_seconds
            }
