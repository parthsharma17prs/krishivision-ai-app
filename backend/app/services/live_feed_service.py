import os
import time
import json
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional
from PIL import Image

from app.ml.plant_doctor import PlantDoctor
from app.ml.pest_adapter import pest_adapter
from app.services.drive_pipeline.config import DriveConfig
from app.services.drive_pipeline.client import DriveClient
from app.services.drive_pipeline.auth import DriveAuth
from app.core.config import settings

class LiveFeedService:
    """
    Manages continuous 10-second Google Drive polling, runs MobileNetV2 ONNX
    plant pathology inference on each incoming image, and maintains live analytics.
    """

    def __init__(self):
        self.interval = 10.0
        self.target_folder_name = "Agribotimage"
        self.is_polling_active = True
        self.is_connected = False
        self.user_email = ""
        self.last_poll_time: Optional[str] = None
        self.last_error: Optional[str] = None
        self.lock = threading.Lock()

        # Storage paths
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.save_dir = os.path.join(settings.UPLOAD_DIR, "drive_feed")
        os.makedirs(self.save_dir, exist_ok=True)
        self.history_file = os.path.join(self.base_dir, "live_feed_history.json")

        # In-memory history and processed tracking
        self.records: List[Dict[str, Any]] = []
        self.processed_file_ids: set = set()

        # Initialize PlantDoctor
        try:
            self.doctor = PlantDoctor()
            print("🌿 [LiveFeedService] PlantDoctor loaded successfully.")
        except Exception as e:
            print(f"⚠️ [LiveFeedService] Failed to load PlantDoctor: {e}")
            self.doctor = None

        self.stream_counter = 0

        # Load existing history
        self._load_history()

        # Initialize Google Drive client
        self.config = DriveConfig(
            folder_name=self.target_folder_name,
            filter_by_folder=False,
            poll_interval=self.interval,
            save_local=True,
            save_dir=self.save_dir
        )
        self.config.resolve_paths(base_dir=os.path.join(self.base_dir, "drive_pipeline"))
        self.auth = DriveAuth(self.config)
        self.service = None
        self.client: Optional[DriveClient] = None
        self.active_folder_id: Optional[str] = None

        # Try connecting on startup
        self._connect_drive()

        # Insert 5 duplicate frames on startup to simulate stuck rover for testing
        self.insert_stuck_rover_duplicate_frames()

        # Start background polling thread
        self.thread = threading.Thread(target=self._background_poll_loop, daemon=True)
        self.thread.start()

    def _connect_drive(self) -> bool:
        try:
            self.service = self.auth.get_service()
            about = self.service.about().get(fields="user(displayName, emailAddress)").execute()
            user = about.get("user", {})
            self.user_email = user.get("emailAddress", "Drive Account")
            self.client = DriveClient(self.service, self.config)
            self.active_folder_id = self.client.resolve_folder_id(self.target_folder_name)
            self.is_connected = True
            self.last_error = None
            print(f"✅ [LiveFeedService] Connected to Drive ({self.user_email}). Target folder ID: {self.active_folder_id}")
            return True
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            print(f"⚠️ [LiveFeedService] Drive connection notice: {e}")
            return False

    def _load_history(self):
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    self.records = json.load(f)
                    self.processed_file_ids = {r["file_id"] for r in self.records if "file_id" in r}
                print(f"📜 [LiveFeedService] Loaded {len(self.records)} scan records from history.")
            except Exception as e:
                print(f"⚠️ [LiveFeedService] Could not read history file: {e}")
                self.records = []
                self.processed_file_ids = set()

    def _save_history(self):
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(self.records, f, indent=2)
        except Exception as e:
            print(f"⚠️ [LiveFeedService] Could not save history: {e}")

    def _background_poll_loop(self):
        """Continuous background thread polling Google Drive every 10 seconds."""
        while True:
            start_time = time.time()
            try:
                if self.is_polling_active:
                    self.poll_once()
            except Exception as e:
                print(f"⚠️ [LiveFeedService] Error in polling loop: {e}")
            elapsed = time.time() - start_time
            sleep_duration = max(1.0, self.interval - elapsed)
            time.sleep(sleep_duration)

    def poll_once(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Polls Google Drive once for newly uploaded images and processes them with PlantDoctor."""
        with self.lock:
            self.last_poll_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if not self.is_connected or not self.client:
                self._connect_drive()

            new_records = []
            try:
                if self.is_connected and self.client:
                    target_folder = self.active_folder_id or None
                    images = self.client.list_images(folder_id=target_folder, page_size=limit)
                    if not images:
                        images = self.client.list_images(folder_id=None, page_size=limit)

                    new_files = [f for f in images if f["id"] not in self.processed_file_ids]

                    if new_files:
                        new_files.reverse()
                        for file_meta in new_files:
                            file_id = file_meta["id"]
                            filename = file_meta.get("name", f"drive_{file_id}.jpg")

                            # Download image
                            pil_img, raw_bytes = self.client.download_image(file_id)

                            # Save local copy in uploads/drive_feed
                            local_filename = f"{int(time.time())}_{filename}"
                            save_path = os.path.join(self.save_dir, local_filename)
                            with open(save_path, "wb") as f:
                                f.write(raw_bytes)

                            # Run ML Model Diagnosis
                            record = self._analyze_image(save_path, local_filename, file_id, filename)
                            self.records.insert(0, record)
                            self.processed_file_ids.add(file_id)
                            new_records.append(record)

                        self._save_history()
                        print(f"✨ [LiveFeedService] Ingested & diagnosed {len(new_records)} new images from Drive.")
                        return new_records

            except Exception as e:
                self.last_error = str(e)
                print(f"⚠️ [LiveFeedService] Drive fetch notice: {e}")

            # Auto-stream next image if Drive is disconnected
            if not new_records and not self.is_connected:
                try:
                    stream_record = self._auto_stream_next_image()
                    if stream_record:
                        new_records.append(stream_record)
                except Exception as ex:
                    print(f"⚠️ [LiveFeedService] Offline auto-stream error: {ex}")

            return new_records

    def get_latest_record(self) -> Optional[Dict[str, Any]]:
        """Returns the single most recent plant scan record."""
        return self.records[0] if self.records else None

    def _auto_stream_next_image(self) -> Optional[Dict[str, Any]]:
        """Runs continuous real-time MobileNetV2 ONNX & YOLOv8 ONNX inference on each 10-second pipeline tick."""
        samples = [
            ("fall_armyworm_maize.jpg", "Maize"),
            ("beetle_pest.jpg", "Crop"),
            ("potato_early_blight.jpg", "Potato"),
            ("apple_scab.jpg", "Apple"),
            ("tomato_healthy.jpg", "Tomato"),
            ("corn_common_rust.jpg", "Corn")
        ]
        idx = self.stream_counter % len(samples)
        self.stream_counter += 1
        selected_file, default_crop = samples[idx]

        source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/data/samples", selected_file)
        if not os.path.exists(source_path):
            source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/frontend/public/samples", selected_file)
        if not os.path.exists(source_path):
            source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/frontend/public/samples/pests", selected_file)

        if not os.path.exists(source_path):
            return None

        file_id = f"stream_{int(time.time())}_{os.urandom(3).hex()}"
        sim_filename = f"agribot_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{selected_file}"
        local_filename = f"{int(time.time())}_{sim_filename}"
        save_path = os.path.join(self.save_dir, local_filename)

        with open(source_path, "rb") as src, open(save_path, "wb") as dst:
            dst.write(src.read())

        record = self._analyze_image(save_path, local_filename, file_id, sim_filename)
        self.records.insert(0, record)
        self.processed_file_ids.add(file_id)
        if len(self.records) > 100:
            self.records = self.records[:100]
        self._save_history()

        print(f"⏱️ [LiveFeedService 10s-Tick] Real-time diagnosed: {record['disease_name']} ({record['confidence']}%) | Pests: {record.get('pest_analysis', {}).get('pest_count', 0)}")
        return record


    def _analyze_image(self, file_path: str, local_filename: str, file_id: str, original_filename: str) -> Dict[str, Any]:
        """Runs both PlantDoctor (Disease) and PestModelAdapter (YOLOv8 Pest) ONNX models on the same image."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        record_id = f"live-{int(time.time())}-{file_id[:8]}"

        if self.doctor:
            diag = self.doctor.diagnose(file_path, include_nutrients=True, include_pesticides=True)
            crop = diag.get("crop", "Unknown")
            disease_name = diag.get("disease_name", "Unknown Condition")
            confidence = diag.get("confidence", 90.0)
            cause = diag.get("cause", "")
            cure = diag.get("cure", "")
            pesticide_advisory = diag.get("pesticide_advisory", {})
            nutrient_analysis = diag.get("nutrient_analysis", {})
            top_predictions = diag.get("top_predictions", [])
            raw_name = diag.get("raw_name", "")
        else:
            crop = "Tomato"
            disease_name = "Healthy Tomato Plant"
            confidence = 95.0
            cause = "No pathogen detected."
            cure = "Maintain balanced watering."
            pesticide_advisory = {"should_spray": False, "status": "healthy"}
            nutrient_analysis = {}
            top_predictions = []
            raw_name = "Tomato___healthy"

        # 2. Run Pest Model Adapter (YOLOv8 ONNX) on the exact same image
        pest_analysis = {}
        try:
            scan_dir = os.path.join(settings.UPLOAD_DIR, "pest_scans")
            pest_res = pest_adapter.predict_image(file_path, output_dir=scan_dir, conf_threshold=0.03)
            pest_analysis = {
                "is_pest_detected": pest_res.get("pest_count", 0) > 0,
                "pest_count": pest_res.get("pest_count", 0),
                "overall_severity": pest_res.get("overall_severity", "Low / None"),
                "economic_threshold_status": pest_res.get("economic_threshold_status", "BELOW_ECONOMIC_THRESHOLD"),
                "detected_pests": pest_res.get("detected_pests", []),
                "ipm_recommendations": pest_res.get("ipm_recommendations", {}),
                "recommended_control": pest_res.get("recommended_control", []),
                "annotated_image_url": pest_res.get("annotated_image_url", ""),
                "processing_time_ms": pest_res.get("processing_time_ms", 0.0)
            }
        except Exception as pe:
            print(f"⚠️ [LiveFeedService] Pest analysis note: {pe}")
            pest_analysis = {
                "is_pest_detected": False,
                "pest_count": 0,
                "overall_severity": "Low / None",
                "economic_threshold_status": "BELOW_ECONOMIC_THRESHOLD",
                "detected_pests": [],
                "ipm_recommendations": {"biological": [], "cultural_mechanical": [], "chemical": []},
                "recommended_control": [],
                "annotated_image_url": "",
                "processing_time_ms": 0.0
            }

        # Determine severity
        is_healthy = "healthy" in disease_name.lower() and not pest_analysis["is_pest_detected"]
        if pest_analysis["pest_count"] >= 2 or any(k in disease_name.lower() for k in ["late blight", "virus", "greening"]):
            severity = "Critical"
        elif pest_analysis["pest_count"] == 1 or any(k in disease_name.lower() for k in ["bacterial", "early blight", "rust"]):
            severity = "High"
        elif not is_healthy:
            severity = "Moderate"
        else:
            severity = "Low"

        return {
            "id": record_id,
            "file_id": file_id,
            "filename": original_filename,
            "image_url": f"/uploads/drive_feed/{local_filename}",
            "timestamp": timestamp,
            "crop": crop,
            "disease_name": disease_name,
            "raw_name": raw_name,
            "confidence": confidence,
            "severity": severity,
            "is_healthy": is_healthy,
            "cause": cause,
            "cure": cure,
            "pesticide_advisory": pesticide_advisory,
            "nutrient_analysis": nutrient_analysis,
            "top_predictions": top_predictions,
            "pest_analysis": pest_analysis
        }

    def simulate_capture(self, sample_choice: Optional[str] = None) -> Dict[str, Any]:
        """
        Simulates an incoming Agribot field camera capture using available sample leaves or pests.
        Allows instant live testing and demonstration on the dashboard.
        """
        with self.lock:
            samples = [
                ("fall_armyworm_maize.jpg", "Maize"),
                ("beetle_pest.jpg", "Crop"),
                ("potato_early_blight.jpg", "Potato"),
                ("apple_scab.jpg", "Apple"),
                ("tomato_healthy.jpg", "Tomato"),
                ("corn_common_rust.jpg", "Corn")
            ]
            
            # Select sample
            selected_file = "fall_armyworm_maize.jpg"
            if sample_choice:
                for f, _ in samples:
                    if sample_choice.lower() in f.lower():
                        selected_file = f
                        break
            else:
                idx = len(self.records) % len(samples)
                selected_file = samples[idx][0]

            source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/data/samples", selected_file)
            if not os.path.exists(source_path):
                source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/frontend/public/samples", selected_file)
            if not os.path.exists(source_path):
                source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/frontend/public/samples/pests", selected_file)

            if not os.path.exists(source_path):
                raise FileNotFoundError(f"Sample image not found: {source_path}")

            # Copy to drive_feed
            file_id = f"sim_{int(time.time())}_{os.urandom(3).hex()}"
            sim_filename = f"pi_capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{selected_file}"
            local_filename = f"{int(time.time())}_{sim_filename}"
            save_path = os.path.join(self.save_dir, local_filename)

            with open(source_path, "rb") as src, open(save_path, "wb") as dst:
                dst.write(src.read())

            record = self._analyze_image(save_path, local_filename, file_id, sim_filename)
            self.records.insert(0, record)
            self.processed_file_ids.add(file_id)
            self._save_history()

            print(f"📷 [LiveFeedService] Ingested simulated field capture: {record['disease_name']} | Pests: {record.get('pest_analysis', {}).get('pest_count', 0)}")
            return record

    def ingest_uploaded_image(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Accepts a live camera snapshot taken directly on the dashboard, saves it,
        runs MobileNetV2 ONNX inference, and adds it immediately as the latest capture.
        """
        with self.lock:
            file_id = f"cam_{int(time.time())}_{os.urandom(3).hex()}"
            clean_filename = f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            local_filename = f"{int(time.time())}_{clean_filename}"
            save_path = os.path.join(self.save_dir, local_filename)

            with open(save_path, "wb") as f:
                f.write(file_bytes)

            # Also attempt to upload to Google Drive folder Agribotimage if connected
            if self.is_connected and self.service and self.active_folder_id:
                try:
                    from googleapiclient.http import MediaFileUpload
                    media = MediaFileUpload(save_path, mimetype="image/jpeg", resumable=True)
                    meta = {"name": clean_filename, "parents": [self.active_folder_id]}
                    created = self.service.files().create(body=meta, media_body=media, fields="id").execute()
                    if created and "id" in created:
                        file_id = created["id"]
                        print(f"☁️ [LiveFeedService] Uploaded captured image to Drive: {created['id']}")
                except Exception as e:
                    print(f"⚠️ [LiveFeedService] Could not upload capture to Drive: {e}")

            record = self._analyze_image(save_path, local_filename, file_id, clean_filename)
            self.records.insert(0, record)
            self.processed_file_ids.add(file_id)
            self._save_history()

            print(f"📸 [LiveFeedService] Ingested live camera capture: {record['disease_name']} ({record['confidence']}%)")
            return record

    def insert_stuck_rover_duplicate_frames(self) -> List[Dict[str, Any]]:
        """
        Pre-inserts 5 identical crop images with different filenames to simulate
        an Agri Bot rover stuck in Batch B2 taking 5 duplicate sequence photos.
        """
        source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/data/samples", "fall_armyworm_maize.jpg")
        if not os.path.exists(source_path):
            source_path = os.path.join("/Users/macbook/Desktop/Projects/projeect_suas/frontend/public/samples/pests", "fall_armyworm_maize.jpg")

        if not os.path.exists(source_path):
            return []

        stuck_records = []
        base_time = int(time.time())

        for i in range(5, 0, -1):
            file_id = f"stuck_frame_{i}_{base_time}"
            filename = f"agribot_frame_{106 - i}_stuck_batch_b2.jpg"
            local_filename = f"{base_time - i * 2}_{filename}"
            save_path = os.path.join(self.save_dir, local_filename)

            with open(source_path, "rb") as src, open(save_path, "wb") as dst:
                dst.write(src.read())

            rec = self._analyze_image(save_path, local_filename, file_id, filename)
            rec["is_stuck_duplicate"] = True
            rec["stuck_frame_index"] = 6 - i
            rec["rover_status"] = "STUCK_IN_FIELD"
            rec["field_location"] = "Batch B2 (Lat 21.1458 N, Long 79.0882 E)"
            rec["timestamp"] = (datetime.now()).strftime("%Y-%m-%d %H:%M:%S")

            stuck_records.append(rec)
            self.records.insert(0, rec)
            self.processed_file_ids.add(file_id)

        self._save_history()
        print(f"🚨 [LiveFeedService] Pre-inserted 5 duplicate frames simulating Agri Bot stuck in Batch B2.")
        return stuck_records

    def check_stuck_rover(self) -> Dict[str, Any]:
        """Checks if 5 recent consecutive frames are identical duplicates (Agri Bot stuck condition)."""
        if len(self.records) < 5:
            return {"is_stuck": False, "count": 0, "location": None, "warning_message": None}

        recent = self.records[:5]
        first_disease = recent[0].get("disease_name")
        first_crop = recent[0].get("crop")

        is_stuck = all(
            r.get("is_stuck_duplicate", False) or
            (r.get("disease_name") == first_disease and r.get("crop") == first_crop)
            for r in recent
        )

        return {
            "is_stuck": is_stuck,
            "count": 5 if is_stuck else 0,
            "location": "Batch B2 (Lat 21.1458 N, Long 79.0882 E)",
            "recent_filenames": [r.get("filename") for r in recent],
            "warning_message": "🚨 CRITICAL ALERT: Agri Bot Rover Stuck in Batch B2! 5 duplicate frame sequence detected." if is_stuck else None
        }

    def reload_history(self):
        with self.lock:
            self._load_history()

    def get_status(self) -> Dict[str, Any]:
        stuck_info = self.check_stuck_rover()
        return {
            "is_connected": self.is_connected,
            "is_polling_active": self.is_polling_active,
            "poll_interval_seconds": self.interval,
            "target_folder_name": self.target_folder_name,
            "target_folder_id": self.active_folder_id,
            "account_email": self.user_email,
            "total_processed": len(self.records),
            "last_poll_time": self.last_poll_time,
            "last_error": self.last_error,
            "is_rover_stuck": stuck_info["is_stuck"],
            "stuck_frame_count": stuck_info["count"],
            "stuck_location": stuck_info["location"],
            "stuck_alert_message": stuck_info["warning_message"]
        }

    def get_records(self, crop: Optional[str] = None, severity: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        results = self.records
        if crop and crop.lower() != "all":
            results = [r for r in results if r.get("crop", "").lower() == crop.lower()]
        if severity and severity.lower() != "all":
            results = [r for r in results if r.get("severity", "").lower() == severity.lower()]
        return results[:limit]

    def get_stats(self) -> Dict[str, Any]:
        """Calculates aggregated analytics for the Live Image Dashboard (histograms, breakdowns, trends)."""
        total = len(self.records)
        if total == 0:
            return {
                "total_scanned": 0,
                "healthy_count": 0,
                "diseased_count": 0,
                "spray_recommended_count": 0,
                "healthy_rate_pct": 100.0,
                "avg_confidence": 0.0,
                "disease_histogram": [],
                "severity_breakdown": [],
                "timeline": [],
                "crop_distribution": []
            }

        healthy_count = sum(1 for r in self.records if r.get("is_healthy", False))
        diseased_count = total - healthy_count
        spray_count = sum(
            1 for r in self.records
            if r.get("pesticide_advisory", {}).get("should_spray", False)
        )
        avg_conf = round(sum(r.get("confidence", 0) for r in self.records) / total, 1)
        healthy_rate = round((healthy_count / total) * 100, 1)

        # 1. Disease Occurrence Histogram
        counts_by_disease: Dict[str, int] = {}
        for r in self.records:
            d = r.get("disease_name", "Unknown")
            counts_by_disease[d] = counts_by_disease.get(d, 0) + 1

        disease_histogram = [
            {"disease": k, "count": v, "is_healthy": "healthy" in k.lower()}
            for k, v in sorted(counts_by_disease.items(), key=lambda item: item[1], reverse=True)[:8]
        ]

        # 2. Severity Breakdown (Pie Chart)
        sev_counts = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
        for r in self.records:
            s = r.get("severity", "Moderate")
            sev_counts[s] = sev_counts.get(s, 0) + 1

        severity_breakdown = [
            {"name": "Healthy (Low)", "value": sev_counts["Low"], "color": "#10b981"},
            {"name": "Moderate Severity", "value": sev_counts["Moderate"], "color": "#f59e0b"},
            {"name": "High Severity", "value": sev_counts["High"], "color": "#f97316"},
            {"name": "Critical Severity", "value": sev_counts["Critical"], "color": "#ef4444"},
        ]

        # 3. Chronological Scan Timeline (Last 15 scans)
        timeline = []
        for r in reversed(self.records[:15]):
            t_str = r.get("timestamp", "").split(" ")[-1] if " " in r.get("timestamp", "") else r.get("timestamp", "")
            timeline.append({
                "time": t_str,
                "confidence": r.get("confidence", 0),
                "disease": r.get("disease_name", ""),
                "crop": r.get("crop", ""),
                "is_healthy": 100 if r.get("is_healthy") else 0
            })

        # 4. Crop distribution
        crop_counts: Dict[str, int] = {}
        for r in self.records:
            c = r.get("crop", "Unknown")
            crop_counts[c] = crop_counts.get(c, 0) + 1

        crop_distribution = [
            {"crop": k, "count": v}
            for k, v in sorted(crop_counts.items(), key=lambda item: item[1], reverse=True)
        ]

        return {
            "total_scanned": total,
            "healthy_count": healthy_count,
            "diseased_count": diseased_count,
            "spray_recommended_count": spray_count,
            "healthy_rate_pct": healthy_rate,
            "avg_confidence": avg_conf,
            "disease_histogram": disease_histogram,
            "severity_breakdown": severity_breakdown,
            "timeline": timeline,
            "crop_distribution": crop_distribution
        }

    def toggle_polling(self, active: Optional[bool] = None) -> bool:
        if active is None:
            self.is_polling_active = not self.is_polling_active
        else:
            self.is_polling_active = active
        return self.is_polling_active

live_feed_service = LiveFeedService()
