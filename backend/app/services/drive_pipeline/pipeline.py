"""
DriveImagePipeline: Core orchestrator for Google Drive polling, downloading, and ML inference.
"""

import json
import os
import signal
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
from PIL import Image

from .adapters import BaseModelAdapter, CallableAdapter, LogOnlyAdapter
from .auth import DriveAuth
from .client import DriveClient
from .config import DriveConfig


class DriveImagePipeline:
    """Continuous Google Drive image ingestion and ML inference pipeline."""

    def __init__(
        self,
        config: Optional[DriveConfig] = None,
        model: Optional[Union[BaseModelAdapter, Callable[[Image.Image, Dict[str, Any]], Any]]] = None,
    ):
        self.config = config or DriveConfig()
        self.config.resolve_paths()

        # Set up model adapter
        if model is None:
            self.adapter: BaseModelAdapter = LogOnlyAdapter()
        elif isinstance(model, BaseModelAdapter):
            self.adapter = model
        elif callable(model):
            self.adapter = CallableAdapter(model)
        else:
            raise TypeError(f"Invalid model type: {type(model)}. Expected BaseModelAdapter or Callable.")

        self.auth = DriveAuth(self.config)
        self.service = None
        self.client: Optional[DriveClient] = None
        self.active_folder_id: Optional[str] = None
        self._processed_ids: Set[str] = set()
        self._running: bool = False

        self._load_history()

    def set_model(self, model: Union[BaseModelAdapter, Callable[[Image.Image, Dict[str, Any]], Any]]):
        """Replaces or sets the active ML model adapter."""
        if isinstance(model, BaseModelAdapter):
            self.adapter = model
        elif callable(model):
            self.adapter = CallableAdapter(model)
        else:
            raise TypeError("Model must be a BaseModelAdapter or a callable.")

    def _load_history(self):
        """Loads list of previously processed file IDs to avoid duplicate predictions."""
        history_path = self.config.history_file
        if os.path.exists(history_path):
            try:
                with open(history_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._processed_ids = set(data if isinstance(data, list) else [])
                    print(f"📜 [Pipeline] Loaded {len(self._processed_ids)} processed file IDs from {history_path}")
            except Exception as e:
                print(f"⚠️ [Pipeline] Could not load history file: {e}")
                self._processed_ids = set()

    def _save_history(self):
        """Persists processed file IDs to disk."""
        history_path = self.config.history_file
        try:
            with open(history_path, "w", encoding="utf-8") as f:
                json.dump(list(self._processed_ids), f, indent=2)
        except Exception as e:
            print(f"⚠️ [Pipeline] Could not save history file: {e}")

    def initialize_drive(self):
        """Authenticates with Google Drive and resolves the target folder."""
        if not self.service:
            print("🚀 [Pipeline] Initializing Google Drive connection...")
            self.service = self.auth.get_service()
            self.client = DriveClient(self.service, self.config)
            self.active_folder_id = self.client.resolve_folder_id(self.config.folder_name)
            print(f"✅ [Pipeline] Connected! Target folder: '{self.config.folder_name}' (ID: {self.active_folder_id})")

    def process_file(self, file_meta: Dict[str, Any]) -> Dict[str, Any]:
        """
        Downloads a single image file, runs it through the model adapter, and marks it processed.
        """
        file_id = file_meta["id"]
        filename = file_meta.get("name", file_id)

        print(f"📥 [Pipeline] Downloading new image: {filename} (ID: {file_id})...")
        pil_img, raw_bytes = self.client.download_image(file_id)

        # Optional local caching
        if self.config.save_local:
            os.makedirs(self.config.save_dir, exist_ok=True)
            save_path = os.path.join(self.config.save_dir, filename)
            with open(save_path, "wb") as f:
                f.write(raw_bytes)
            print(f"💾 [Pipeline] Saved copy to {save_path}")

        # Run ML model inference
        print(f"🔮 [Pipeline] Running ML model inference on {filename}...")
        start_t = time.time()
        result = self.adapter.predict(pil_img, file_meta)
        elapsed_ms = round((time.time() - start_t) * 1000, 2)

        # Mark as processed
        self._processed_ids.add(file_id)
        self._save_history()

        return {
            "file_id": file_id,
            "filename": filename,
            "elapsed_ms": elapsed_ms,
            "result": result,
        }

    def poll_once(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Performs a single polling pass on Google Drive.
        Returns a list of prediction records for newly processed images.
        """
        if not self.service or not self.client:
            self.initialize_drive()

        target_folder = self.active_folder_id if self.config.filter_by_folder else None
        images = self.client.list_images(folder_id=target_folder, page_size=limit)
        new_files = [f for f in images if f["id"] not in self._processed_ids]

        if not new_files:
            return []

        # Process oldest new image first (natural chronology)
        new_files.reverse()
        results = []
        for file_meta in new_files:
            record = self.process_file(file_meta)
            results.append(record)

        return results

    def watch(
        self,
        poll_interval: Optional[float] = None,
        max_iterations: Optional[int] = None,
    ):
        """
        Runs the continuous Google Drive polling loop.
        Monitors the folder for new images, feeds them to the model, and tracks history.
        """
        interval = poll_interval or self.config.poll_interval
        self._running = True

        def _sig_handler(sig, frame):
            print("\n🛑 [Pipeline] Gracefully shutting down...")
            self._running = False

        signal.signal(signal.SIGINT, _sig_handler)
        signal.signal(signal.SIGTERM, _sig_handler)

        print(f"👁️  [Pipeline] Watching Drive folder '{self.config.folder_name}' every {interval}s...")
        iteration = 0
        consecutive_errors = 0

        while self._running:
            try:
                processed = self.poll_once()
                if processed:
                    print(f"✨ [Pipeline] Processed {len(processed)} new image(s).")
                consecutive_errors = 0
            except Exception as e:
                consecutive_errors += 1
                backoff = min(60, interval * (2 ** min(consecutive_errors - 1, 4)))
                print(f"⚠️ [Pipeline] Polling error ({e}). Backing off for {backoff:.1f}s...")
                time.sleep(backoff)
                # Attempt to re-initialize service on next cycle
                self.service = None
                continue

            iteration += 1
            if max_iterations and iteration >= max_iterations:
                break

            time.sleep(interval)

        print("👋 [Pipeline] Watcher stopped.")
