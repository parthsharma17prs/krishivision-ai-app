import cv2
import time
import queue
import threading
import numpy as np
from typing import Optional, Tuple, Dict, Any, Union
from edge.app.camera.fps_tracker import FPSTracker

class CameraPipeline:
    """
    Decoupled Asynchronous Camera Pipeline.
    Runs a dedicated capture thread that continuously reads from the camera source
    and pushes to a bounded frame queue. AI inference runs asynchronously on a separate worker.
    """

    def __init__(
        self,
        source: Union[int, str] = 0,
        target_capture_fps: float = 30.0,
        width: int = 640,
        height: int = 480,
        queue_size: int = 2
    ):
        self.source = source
        self.target_capture_fps = target_capture_fps
        self.width = width
        self.height = height
        self.queue_size = queue_size

        self.frame_queue: queue.Queue = queue.Queue(maxsize=queue_size)
        self.fps_tracker = FPSTracker()

        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._cap: Optional[cv2.VideoCapture] = None
        self._is_camera_open = False
        self._using_test_pattern = False
        self._last_error: Optional[str] = None
        self._lock = threading.Lock()

    def _open_camera(self) -> bool:
        try:
            # Check if source is integer (device index) or string (file/RTSP)
            src = self.source
            if isinstance(src, str) and src.isdigit():
                src = int(src)

            self._cap = cv2.VideoCapture(src)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                self._is_camera_open = True
                self._using_test_pattern = False
                self._last_error = None
                print(f"📷 [CameraPipeline] Camera opened successfully on source: {self.source}")
                return True
            else:
                self._is_camera_open = False
                self._using_test_pattern = True
                self._last_error = f"Cannot open camera source '{self.source}'. Using test pattern fallback."
                print(f"⚠️ [CameraPipeline] {self._last_error}")
                return False
        except Exception as e:
            self._is_camera_open = False
            self._using_test_pattern = True
            self._last_error = str(e)
            print(f"⚠️ [CameraPipeline] Camera exception: {e}. Using test pattern fallback.")
            return False

    def _generate_synthetic_leaf_frame(self) -> np.ndarray:
        """
        Generates a test card frame if no hardware camera is connected,
        allowing the edge pipeline to run and be benchmarked cleanly.
        """
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        # Background: earthy dark green/brown
        frame[:] = (35, 45, 30)

        # Draw a synthetic leaf contour in center
        center_x, center_y = self.width // 2, self.height // 2
        # Outer leaf oval
        cv2.ellipse(frame, (center_x, center_y), (140, 90), 25, 0, 360, (40, 150, 45), -1)
        # Vein line
        cv2.line(frame, (center_x - 110, center_y + 40), (center_x + 110, center_y - 40), (80, 200, 85), 3)

        # Overlay test pattern info
        t_str = time.strftime("%H:%M:%S")
        cv2.putText(frame, "KrishiVision Edge Test Stream", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f"Time: {t_str} | Source: {self.source} (Fallback)", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 220, 180), 1)

        return frame

    def _capture_worker(self):
        """Dedicated background loop capturing frames without blocking AI inference."""
        self._open_camera()
        interval = 1.0 / max(1.0, self.target_capture_fps)

        while self._running:
            loop_start = time.time()
            frame = None

            if self._is_camera_open and self._cap:
                ret, captured = self._cap.read()
                if ret and captured is not None:
                    frame = captured
                else:
                    # Temporary read failure; retry opening camera
                    time.sleep(0.1)
                    self._open_camera()
                    frame = self._generate_synthetic_leaf_frame()
            else:
                frame = self._generate_synthetic_leaf_frame()

            if frame is not None:
                capture_timestamp = time.time()
                self.fps_tracker.record_capture()

                # Push to bounded queue (drop oldest frame if full to prevent stale queue lag)
                if self.frame_queue.full():
                    try:
                        self.frame_queue.get_nowait()
                        self.fps_tracker.record_drop()
                    except queue.Empty:
                        pass

                try:
                    self.frame_queue.put_nowait((frame, capture_timestamp))
                except queue.Full:
                    self.fps_tracker.record_drop()

            elapsed = time.time() - loop_start
            sleep_time = max(0.001, interval - elapsed)
            time.sleep(sleep_time)

        # Cleanup
        if self._cap:
            self._cap.release()
            self._cap = None
        self._is_camera_open = False

    def start(self):
        with self._lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._capture_worker, daemon=True, name="CameraCaptureThread")
                self._thread.start()
                print("🚀 [CameraPipeline] Capture thread started.")

    def stop(self):
        with self._lock:
            self._running = False
            if self._thread and self._thread.is_alive():
                self._thread.join(timeout=2.0)
            self._thread = None
            print("🛑 [CameraPipeline] Capture thread stopped.")

    @property
    def is_running(self) -> bool:
        return self._running

    def read(self, timeout: float = 0.5) -> Optional[Tuple[np.ndarray, float]]:
        """Alias for get_frame to match common camera interfaces."""
        return self.get_frame(timeout=timeout)

    def get_stats(self) -> Dict[str, Any]:
        """Convenience method to retrieve rolling FPS and latency metrics."""
        return self.fps_tracker.get_metrics()

    def get_frame(self, timeout: float = 0.5) -> Optional[Tuple[np.ndarray, float]]:
        """Retrieves the latest available frame and its capture timestamp."""
        try:
            return self.frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def get_status(self) -> Dict[str, Any]:
        return {
            "source": str(self.source),
            "is_running": self._running,
            "is_camera_open": self._is_camera_open,
            "using_test_pattern": self._using_test_pattern,
            "queue_size": self.frame_queue.qsize(),
            "target_capture_fps": self.target_capture_fps,
            "last_error": self._last_error,
            "metrics": self.fps_tracker.get_metrics()
        }
