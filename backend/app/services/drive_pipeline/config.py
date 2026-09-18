"""
Configuration module for the Google Drive ingestion pipeline.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple
import os

DEFAULT_SCOPES = ["https://www.googleapis.com/auth/drive.file"]

@dataclass
class DriveConfig:
    """Configuration settings for Google Drive continuous data pipeline."""

    # Target folder specification (either by name or direct Google Drive Folder ID)
    folder_name: str = "Agribotimage"
    folder_id: Optional[str] = None
    filter_by_folder: bool = False  # If False, ingests all images uploaded to this Drive app

    # Credentials paths (will search sensible defaults if not provided)
    credentials_file: Optional[str] = None
    token_file: Optional[str] = None
    scopes: List[str] = field(default_factory=lambda: list(DEFAULT_SCOPES))

    # Pipeline execution settings
    poll_interval: float = 5.0
    history_file: str = "processed_history.json"
    save_local: bool = False
    save_dir: str = "downloads"
    socket_timeout: int = 60

    # Allowed MIME types for ingestion
    allowed_mime_types: Tuple[str, ...] = (
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
    )

    def resolve_paths(self, base_dir: Optional[str] = None):
        """Resolves credentials and token file paths from known locations."""
        search_dirs = []
        if base_dir:
            search_dirs.append(Path(base_dir))

        curr = Path.cwd()
        search_dirs.extend([
            curr,
            curr / "drive_pipeline",
            curr / "raspberry_pi",
            curr / "Agribot",
            curr / "plant_dashboard",
            Path(__file__).parent,
            Path(__file__).parent.parent / "raspberry_pi",
            Path(__file__).parent.parent / "Agribot",
        ])

        # Resolve token file if not explicitly set
        if not self.token_file or not os.path.exists(self.token_file):
            for d in search_dirs:
                candidate_json = d / "token.json"
                if candidate_json.is_file():
                    self.token_file = str(candidate_json.resolve())
                    break
                candidate_pickle = d / "token.pickle"
                if candidate_pickle.is_file():
                    self.token_file = str(candidate_pickle.resolve())
                    break

        # Resolve credentials file if not explicitly set
        if not self.credentials_file or not os.path.exists(self.credentials_file):
            for d in search_dirs:
                cand = d / "credentials.json"
                if cand.is_file():
                    self.credentials_file = str(cand.resolve())
                    break
                # Also check client_secret*.json
                secrets = list(d.glob("client_secret*.json"))
                if secrets:
                    self.credentials_file = str(secrets[0].resolve())
                    break
