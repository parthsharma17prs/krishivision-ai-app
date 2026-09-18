import time
import threading
from typing import Dict, Any, Optional
import requests

from edge.app.config.settings import edge_settings
from edge.app.storage.db import EdgeDatabase

class SyncWorker:
    """
    Offline-resilient background sync agent.
    Drains the local SQLite sync_queue when cloud connectivity is available.
    Ensures zero data loss during network blackouts.
    """

    def __init__(
        self,
        db: EdgeDatabase,
        cloud_url: Optional[str] = None,
        sync_interval: Optional[float] = None,
        batch_size: Optional[int] = None
    ):
        self.db = db
        self.cloud_url = cloud_url or edge_settings.sync.cloud_backend_url
        self.sync_interval = sync_interval or edge_settings.sync.sync_interval_seconds
        self.batch_size = batch_size or edge_settings.sync.batch_size

        self.running = False
        self.thread: Optional[threading.Thread] = None

        self.is_cloud_online = False
        self.last_sync_time: Optional[float] = None
        self.total_items_synced = 0
        self.last_error: Optional[str] = None

    def start(self) -> None:
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True, name="EdgeSyncWorkerThread")
        self.thread.start()

    def stop(self) -> None:
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)

    def _check_connectivity(self) -> bool:
        """Pings the backend to verify internet/cloud availability."""
        try:
            # Check root health or sync endpoint
            base_url = self.cloud_url.split("/api/")[0]
            res = requests.get(f"{base_url}/health", timeout=2.0)
            return res.status_code == 200
        except Exception:
            return False

    def sync_once(self) -> Dict[str, Any]:
        """Performs a single sync iteration."""
        items = self.db.get_pending_sync_items(limit=self.batch_size)
        if not items:
            return {"status": "IDLE", "synced_count": 0, "pending_count": 0}

        # Check cloud connectivity
        self.is_cloud_online = self._check_connectivity()
        if not self.is_cloud_online:
            self.last_error = "Cloud backend unreachable (Offline mode active)"
            return {
                "status": "OFFLINE",
                "synced_count": 0,
                "pending_count": len(items),
                "message": "Items queued safely in local SQLite storage."
            }

        # Push batch to cloud backend
        queue_ids = [item["queue_id"] for item in items]
        payload = {
            "node_name": edge_settings.service.name,
            "field_id": edge_settings.service.field_id,
            "farm_id": edge_settings.service.farm_id,
            "timestamp": time.time(),
            "batch_size": len(items),
            "items": items
        }

        try:
            res = requests.post(self.cloud_url, json=payload, timeout=5.0)
            if res.status_code in [200, 201]:
                self.db.mark_items_synced(queue_ids)
                self.total_items_synced += len(items)
                self.last_sync_time = time.time()
                self.last_error = None
                return {"status": "SUCCESS", "synced_count": len(items), "pending_count": 0}
            else:
                err_msg = f"Cloud rejected batch with HTTP {res.status_code}: {res.text[:100]}"
                self.last_error = err_msg
                self.db.mark_items_failed(queue_ids, err_msg)
                return {"status": "REJECTED", "synced_count": 0, "pending_count": len(items)}
        except Exception as e:
            err_msg = f"Sync push failed: {str(e)}"
            self.last_error = err_msg
            self.is_cloud_online = False
            self.db.mark_items_failed(queue_ids, err_msg)
            return {"status": "NETWORK_ERROR", "synced_count": 0, "pending_count": len(items)}

    def _run_loop(self) -> None:
        while self.running:
            try:
                self.sync_once()
            except Exception as e:
                self.last_error = f"Unhandled exception in sync worker: {str(e)}"
            time.sleep(self.sync_interval)

    def get_status(self) -> Dict[str, Any]:
        stats = self.db.get_storage_stats()
        return {
            "worker_running": self.running,
            "cloud_online": self.is_cloud_online,
            "cloud_url": self.cloud_url,
            "sync_interval_seconds": self.sync_interval,
            "pending_sync_items": stats.get("pending_sync_items", 0),
            "total_items_synced": self.total_items_synced,
            "last_sync_timestamp": self.last_sync_time,
            "last_error": self.last_error
        }
