import time
from typing import Dict, Any, List
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

router = APIRouter(prefix="/edge", tags=["Edge Computing & Offline Sync"])

class SyncBatchItem(BaseModel):
    queue_id: int
    entity_type: str
    entity_id: str
    payload: Dict[str, Any]
    retry_count: int = 0

class EdgeSyncBatch(BaseModel):
    node_name: str
    field_id: str
    farm_id: str
    timestamp: float
    batch_size: int
    items: List[SyncBatchItem]

# In-memory edge node registry for cloud dashboard visibility
_edge_nodes_status: Dict[str, Dict[str, Any]] = {}
_latest_synced_decisions: List[Dict[str, Any]] = []

@router.post("/sync")
def receive_edge_sync_batch(batch: EdgeSyncBatch):
    """
    Receives batched offline synchronization packets from Edge AI nodes.
    Ingests local decisions, inferences, and sensor telemetry.
    """
    _edge_nodes_status[batch.node_name] = {
        "node_name": batch.node_name,
        "field_id": batch.field_id,
        "farm_id": batch.farm_id,
        "last_sync_timestamp": batch.timestamp,
        "last_sync_received_at": time.time(),
        "status": "ONLINE"
    }

    for item in batch.items:
        if item.entity_type == "farm_decision":
            _latest_synced_decisions.append(item.payload)
            if len(_latest_synced_decisions) > 50:
                _latest_synced_decisions.pop(0)

    return {
        "success": True,
        "node_name": batch.node_name,
        "synced_items_count": len(batch.items),
        "received_at": time.time()
    }

@router.get("/nodes")
def get_edge_nodes():
    """Lists registered edge nodes and their cloud sync status."""
    return {
        "nodes": list(_edge_nodes_status.values()),
        "total_nodes": len(_edge_nodes_status),
        "latest_synced_decisions": _latest_synced_decisions[-10:]
    }
