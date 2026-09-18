import cv2
import numpy as np
import base64
from typing import Dict, Any, Optional

def annotate_edge_frame(
    frame: np.ndarray,
    disease_res: Dict[str, Any],
    fps_stats: Dict[str, Any],
    sensor_reading: Optional[Any] = None,
    offline_mode: bool = True
) -> np.ndarray:
    """
    Renders high-contrast on-device HUD overlays onto the video frame:
    - Bounding box around detected leaf / pathology
    - True measured capture FPS and inference latency
    - Zero-Cloud Local Inference Badge
    - Active Crop Disease and Confidence %
    """
    if frame is None:
        return np.zeros((480, 640, 3), dtype=np.uint8)

    annotated = frame.copy()
    h, w = annotated.shape[:2]

    # 1. Bounding Box & Pathology Tag
    bbox = disease_res.get("leaf_roi")
    detected = disease_res.get("detected", False)
    status = disease_res.get("status", "SEARCHING")
    disease_name = disease_res.get("disease_name", "Scanning foliage...")
    conf = disease_res.get("confidence_pct", 0.0)

    # Box color: Green if healthy, Red/Orange if disease detected, Yellow if low confidence
    if disease_res.get("is_healthy", False):
        box_color = (0, 220, 0)  # Green
    elif detected:
        box_color = (0, 70, 255)  # Orange-Red
    else:
        box_color = (255, 190, 0)  # Cyan-Yellow

    if bbox and len(bbox) == 4:
        bx, by, bw, bh = bbox
        # Draw bounding rectangle with corner accents
        cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), box_color, 2)
        # Corner markers
        c_len = min(20, bw // 4, bh // 4)
        cv2.line(annotated, (bx, by), (bx + c_len, by), box_color, 4)
        cv2.line(annotated, (bx, by), (bx, by + c_len), box_color, 4)
        cv2.line(annotated, (bx + bw, by), (bx + bw - c_len, by), box_color, 4)
        cv2.line(annotated, (bx + bw, by), (bx + bw, by + c_len), box_color, 4)

        # Label badge above box
        label_text = f"{disease_name} ({conf}%)" if detected or disease_res.get("is_healthy") else status
        cv2.rectangle(annotated, (bx, max(0, by - 24)), (bx + len(label_text) * 10 + 10, by), box_color, -1)
        cv2.putText(annotated, label_text, (bx + 5, max(16, by - 7)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    # 2. Header Bar: Zero-Cloud Local Inference Badge & FPS Counters
    cv2.rectangle(annotated, (0, 0), (w, 32), (20, 20, 20), -1)

    # Local Edge AI badge
    cv2.circle(annotated, (14, 16), 6, (0, 255, 0), -1)
    cv2.putText(annotated, "LOCAL EDGE AI [100% OFFLINE]", (26, 21),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 255, 0), 1, cv2.LINE_AA)

    # Measured FPS & Latency stats (Zero fabrication)
    cap_fps = fps_stats.get("capture_fps", 0.0)
    inf_fps = fps_stats.get("inference_fps", 0.0)
    lat_p95 = fps_stats.get("p95_latency_ms", 0.0)

    perf_text = f"CAP: {cap_fps:.1f} FPS | INF: {inf_fps:.1f} FPS | P95: {lat_p95:.1f}ms"
    text_size = cv2.getTextSize(perf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)[0]
    cv2.putText(annotated, perf_text, (w - text_size[0] - 12, 21),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)

    # 3. Footer Bar: Sensor Telemetry
    if sensor_reading:
        cv2.rectangle(annotated, (0, h - 26), (w, h), (15, 15, 15), -1)
        temp_str = f"{sensor_reading.temperature_c:.1f}°C" if sensor_reading.temperature_c is not None else "--"
        hum_str = f"{sensor_reading.humidity_pct:.1f}%" if sensor_reading.humidity_pct is not None else "--"
        soil_str = f"{sensor_reading.soil_moisture_pct:.1f}%" if sensor_reading.soil_moisture_pct is not None else "--"
        tank_str = f"{sensor_reading.water_tank_level_cm:.0f}cm" if sensor_reading.water_tank_level_cm is not None else "--"

        telemetry_text = f"SOIL: {soil_str} | TEMP: {temp_str} | HUM: {hum_str} | TANK: {tank_str}"
        cv2.putText(annotated, telemetry_text, (12, h - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 240, 180), 1, cv2.LINE_AA)

    return annotated

def encode_frame_to_base64_jpeg(frame: np.ndarray, quality: int = 80) -> str:
    """Encodes BGR numpy array to JPEG base64 string for WebSocket transmission."""
    success, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not success:
        return ""
    return base64.b64encode(buffer).decode("utf-8")
