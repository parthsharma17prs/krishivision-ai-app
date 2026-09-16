import os
import json
from typing import Dict, Any, List, Optional
from app.core.config import settings

class FirebaseManager:
    """
    Firebase Admin SDK & Firestore Database Manager.
    Allows KrishiVision AI to store and sync farms, sensor readings, plant scans,
    and alerts in Google Firebase Firestore.
    """

    def __init__(self):
        self.is_initialized = False
        self.db = None
        self.auth = None
        self.init_firebase()

    def init_firebase(self) -> bool:
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if cred_path and os.path.exists(cred_path):
            try:
                import firebase_admin
                from firebase_admin import credentials, firestore, auth

                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    options = {}
                    if settings.FIREBASE_DATABASE_URL:
                        options['databaseURL'] = settings.FIREBASE_DATABASE_URL
                    firebase_admin.initialize_app(cred, options)

                self.db = firestore.client()
                self.auth = auth
                self.is_initialized = True
                print("[INFO] Firebase Admin SDK & Firestore initialized successfully.")
                return True
            except Exception as e:
                print(f"[WARNING] Failed to initialize Firebase Admin SDK: {e}")
                self.is_initialized = False
                return False
        else:
            print("[INFO] Firebase credentials JSON not found. Running in local/SQL mode.")
            self.is_initialized = False
            return False

    def status(self) -> Dict[str, Any]:
        return {
            "initialized": self.is_initialized,
            "database_type": settings.DATABASE_TYPE,
            "credentials_file": settings.FIREBASE_CREDENTIALS_PATH,
            "credentials_present": os.path.exists(settings.FIREBASE_CREDENTIALS_PATH or "")
        }

    # Firestore Helper Methods
    def save_document(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> bool:
        if not self.is_initialized or not self.db:
            return False
        try:
            self.db.collection(collection_name).document(doc_id).set(data, merge=True)
            return True
        except Exception as e:
            print(f"[ERROR] Firestore save error in '{collection_name}': {e}")
            return False

    def get_document(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_initialized or not self.db:
            return None
        try:
            doc = self.db.collection(collection_name).document(doc_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"[ERROR] Firestore get error in '{collection_name}': {e}")
            return None

    def get_collection(self, collection_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.is_initialized or not self.db:
            return []
        try:
            docs = self.db.collection(collection_name).limit(limit).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"[ERROR] Firestore list error in '{collection_name}': {e}")
            return []

firebase_manager = FirebaseManager()
