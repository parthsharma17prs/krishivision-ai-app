import os
import json
import sqlite3
import time
from typing import Dict, Any, List, Optional
from edge.app.config.settings import edge_settings
from edge.app.sensors.base import SensorReading
from edge.app.decision.engine import FarmDecision

class EdgeDatabase:
    """
    Embedded SQLite database for resilient local on-device persistence.
    Operates 100% offline with zero external database dependencies.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or edge_settings.storage.db_path
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # 1. Sensor Telemetry Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    source TEXT NOT NULL,
                    temperature_c REAL,
                    humidity_pct REAL,
                    soil_moisture_pct REAL,
                    water_tank_level_cm REAL,
                    chemical_npk_available INTEGER DEFAULT 0,
                    nitrogen_ppm REAL,
                    phosphorus_ppm REAL,
                    potassium_ppm REAL,
                    is_valid INTEGER DEFAULT 1,
                    anomaly_flags_json TEXT,
                    created_at REAL DEFAULT (strftime('%s', 'now'))
                );
            """)

            # 2. Visual Inference Events Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inference_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    model_name TEXT NOT NULL,
                    detected INTEGER NOT NULL,
                    confidence_pct REAL NOT NULL,
                    latency_ms REAL NOT NULL,
                    raw_class TEXT,
                    disease_name TEXT,
                    crop TEXT,
                    severity TEXT,
                    requires_manual_inspection INTEGER DEFAULT 0,
                    details_json TEXT,
                    created_at REAL DEFAULT (strftime('%s', 'now'))
                );
            """)

            # 3. Autonomous Farm Decisions Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS farm_decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    decision_id TEXT UNIQUE NOT NULL,
                    timestamp REAL NOT NULL,
                    field_id TEXT NOT NULL,
                    farm_id TEXT NOT NULL,
                    primary_action TEXT NOT NULL,
                    urgency TEXT NOT NULL,
                    summary_headline TEXT NOT NULL,
                    action_items_json TEXT,
                    evidence_codes_json TEXT,
                    full_payload_json TEXT NOT NULL,
                    created_at REAL DEFAULT (strftime('%s', 'now'))
                );
            """)

            # 4. Asynchronous Offline Sync Queue
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sync_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at REAL NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT,
                    payload_json TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    last_attempt_at REAL,
                    status TEXT DEFAULT 'pending'
                );
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue (status, retry_count);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_decisions_time ON farm_decisions (timestamp DESC);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_time ON sensor_readings (timestamp DESC);")
            conn.commit()

    def save_sensor_reading(self, reading: SensorReading, queue_sync: bool = True) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sensor_readings (
                    timestamp, source, temperature_c, humidity_pct, soil_moisture_pct,
                    water_tank_level_cm, chemical_npk_available, nitrogen_ppm,
                    phosphorus_ppm, potassium_ppm, is_valid, anomaly_flags_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                reading.timestamp,
                reading.source,
                reading.temperature_c,
                reading.humidity_pct,
                reading.soil_moisture_pct,
                reading.water_tank_level_cm,
                1 if reading.chemical_npk_available else 0,
                reading.nitrogen_ppm,
                reading.phosphorus_ppm,
                reading.potassium_ppm,
                1 if reading.is_valid else 0,
                json.dumps(reading.anomaly_flags)
            ))
            reading_id = cursor.lastrowid

            if queue_sync:
                cursor.execute("""
                    INSERT INTO sync_queue (created_at, entity_type, entity_id, payload_json)
                    VALUES (?, 'sensor_reading', ?, ?);
                """, (time.time(), str(reading_id), json.dumps(reading.model_dump())))

            conn.commit()
            return reading_id

    def save_inference_event(self, event: Dict[str, Any], queue_sync: bool = True) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO inference_events (
                    timestamp, model_name, detected, confidence_pct, latency_ms,
                    raw_class, disease_name, crop, severity, requires_manual_inspection,
                    details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                event.get("timestamp", time.time()),
                event.get("model", "UnknownModel"),
                1 if event.get("detected") else 0,
                event.get("confidence_pct", 0.0),
                event.get("latency_ms", 0.0),
                event.get("raw_class"),
                event.get("disease_name"),
                event.get("crop"),
                event.get("severity"),
                1 if event.get("requires_manual_inspection") else 0,
                json.dumps(event)
            ))
            event_id = cursor.lastrowid

            if queue_sync:
                cursor.execute("""
                    INSERT INTO sync_queue (created_at, entity_type, entity_id, payload_json)
                    VALUES (?, 'inference_event', ?, ?);
                """, (time.time(), str(event_id), json.dumps(event)))

            conn.commit()
            return event_id

    def save_farm_decision(self, decision: FarmDecision, queue_sync: bool = True) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            payload = decision.model_dump()
            cursor.execute("""
                INSERT OR REPLACE INTO farm_decisions (
                    decision_id, timestamp, field_id, farm_id, primary_action,
                    urgency, summary_headline, action_items_json, evidence_codes_json,
                    full_payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                decision.decision_id,
                decision.timestamp,
                decision.field_id,
                decision.farm_id,
                decision.primary_action,
                decision.urgency,
                decision.summary_headline,
                json.dumps(decision.action_items),
                json.dumps(decision.evidence_codes),
                json.dumps(payload)
            ))
            dec_id = cursor.lastrowid

            if queue_sync:
                cursor.execute("""
                    INSERT INTO sync_queue (created_at, entity_type, entity_id, payload_json)
                    VALUES (?, 'farm_decision', ?, ?);
                """, (time.time(), decision.decision_id, json.dumps(payload)))

            conn.commit()
            return dec_id

    def get_pending_sync_items(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, entity_type, entity_id, payload_json, retry_count
                FROM sync_queue
                WHERE status = 'pending' AND retry_count < 10
                ORDER BY id ASC
                LIMIT ?;
            """, (limit,))
            rows = cursor.fetchall()
            return [
                {
                    "queue_id": row["id"],
                    "entity_type": row["entity_type"],
                    "entity_id": row["entity_id"],
                    "payload": json.loads(row["payload_json"]),
                    "retry_count": row["retry_count"]
                }
                for row in rows
            ]

    def mark_items_synced(self, queue_ids: List[int]) -> None:
        if not queue_ids:
            return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" * len(queue_ids))
            cursor.execute(f"""
                UPDATE sync_queue
                SET status = 'synced', last_attempt_at = ?
                WHERE id IN ({placeholders});
            """, [time.time()] + queue_ids)
            conn.commit()

    def mark_items_failed(self, queue_ids: List[int], error_msg: str) -> None:
        if not queue_ids:
            return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" * len(queue_ids))
            cursor.execute(f"""
                UPDATE sync_queue
                SET retry_count = retry_count + 1, last_attempt_at = ?
                WHERE id IN ({placeholders});
            """, [time.time()] + queue_ids)
            conn.commit()

    def get_latest_decision(self) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT full_payload_json FROM farm_decisions
                ORDER BY timestamp DESC LIMIT 1;
            """)
            row = cursor.fetchone()
            if row:
                return json.loads(row["full_payload_json"])
            return None

    def get_storage_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM sensor_readings;")
            total_readings = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM inference_events;")
            total_inferences = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM farm_decisions;")
            total_decisions = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending';")
            pending_sync = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM sync_queue WHERE status = 'synced';")
            synced_count = cursor.fetchone()[0]

            file_size_bytes = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0

            return {
                "db_path": self.db_path,
                "file_size_kb": round(file_size_bytes / 1024.0, 1),
                "total_sensor_readings": total_readings,
                "total_inference_events": total_inferences,
                "total_farm_decisions": total_decisions,
                "pending_sync_items": pending_sync,
                "synced_items": synced_count
            }
