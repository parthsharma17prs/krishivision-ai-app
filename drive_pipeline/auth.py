"""
Authentication manager for Google Drive API v3.
"""

import json
import os
import pickle
import socket
import time
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import Resource, build

from .config import DriveConfig


class DriveAuth:
    """Handles OAuth2 credential loading, refreshing, and service creation."""

    def __init__(self, config: Optional[DriveConfig] = None):
        self.config = config or DriveConfig()
        self.config.resolve_paths()
        if self.config.socket_timeout > 0:
            socket.setdefaulttimeout(self.config.socket_timeout)

    @staticmethod
    def is_connected(host="8.8.8.8", port=53, timeout=3) -> bool:
        """Checks if internet connectivity is available."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            sock.close()
            return True
        except OSError:
            return False

    def load_credentials(self) -> Credentials:
        """Loads and refreshes OAuth2 credentials from token file or credentials.json."""
        creds: Optional[Credentials] = None
        token_path = self.config.token_file

        # 1. Try loading from token file (JSON or pickle)
        if token_path and os.path.exists(token_path):
            if token_path.endswith(".json"):
                try:
                    with open(token_path, "r", encoding="utf-8") as f:
                        info = json.load(f)
                    creds = Credentials.from_authorized_user_info(info, self.config.scopes)
                except Exception as e:
                    print(f"⚠️ [DriveAuth] Failed to load token.json ({e}). Retrying refresh...")
                    creds = None
            elif token_path.endswith(".pickle"):
                try:
                    with open(token_path, "rb") as f:
                        creds = pickle.load(f)
                except Exception as e:
                    print(f"⚠️ [DriveAuth] Failed to load token.pickle ({e}). Retrying...")
                    creds = None

        # 2. Refresh expired credentials
        if creds and not creds.valid:
            if creds.expired and creds.refresh_token:
                last_err = None
                for attempt in range(1, 4):
                    try:
                        print(f"🔄 [DriveAuth] Refreshing expired Google Drive token (attempt {attempt}/3)...")
                        creds.refresh(Request())
                        print("✅ [DriveAuth] Token successfully refreshed!")
                        self._persist_token(creds)
                        last_err = None
                        break
                    except Exception as e:
                        last_err = e
                        print(f"⚠️ [DriveAuth] Token refresh attempt {attempt} failed: {e}")
                        time.sleep(2 * attempt)

                if last_err is not None:
                    # If it was an invalid_grant (revoked), allow fallback; otherwise raise to retry
                    err_str = str(last_err).lower()
                    if "invalid_grant" in err_str:
                        print("⚠️ [DriveAuth] Token was revoked or invalid. Falling back to login flow...")
                        creds = None
                    else:
                        raise ConnectionError(
                            f"Network error while refreshing Google Drive token: {last_err}. "
                            "Please check your internet connection."
                        )

        # 3. If still no valid credentials, run interactive flow
        if not creds or not creds.valid:
            creds_path = self.config.credentials_file
            if not creds_path or not os.path.exists(creds_path):
                raise FileNotFoundError(
                    f"Neither a valid token nor a credentials.json was found. "
                    f"Looked for: credentials={creds_path}, token={token_path}."
                )

            print(f"🌐 [DriveAuth] Launching browser flow for client secrets: {creds_path}")
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, self.config.scopes)
            creds = flow.run_local_server(port=0)
            self._persist_token(creds)

        return creds

    def _persist_token(self, creds: Credentials):
        """Saves active credentials back to disk for seamless future runs."""
        target = self.config.token_file
        if not target or target.endswith(".pickle"):
            # Prefer JSON format for portability across python versions
            base_dir = os.path.dirname(target) if target else os.getcwd()
            target = os.path.join(base_dir, "token.json")
            self.config.token_file = target

        try:
            with open(target, "w", encoding="utf-8") as f:
                f.write(creds.to_json())
            print(f"💾 [DriveAuth] Saved updated token to: {target}")
        except Exception as e:
            print(f"⚠️ [DriveAuth] Could not write token to disk: {e}")

    def get_service(self) -> Resource:
        """Returns an authenticated Drive v3 service resource."""
        creds = self.load_credentials()
        return build("drive", "v3", credentials=creds, cache_discovery=False)
