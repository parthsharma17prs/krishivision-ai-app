"""
Drive client operations: folder resolution, image listing, and streaming downloads.
"""

import io
import os
from typing import Any, Dict, List, Optional, Tuple

from googleapiclient.discovery import Resource
from googleapiclient.http import MediaIoBaseDownload
from PIL import Image

from .config import DriveConfig


class DriveClient:
    """Handles Drive API calls for folders and image files."""

    def __init__(self, service: Resource, config: Optional[DriveConfig] = None):
        self.service = service
        self.config = config or DriveConfig()

    def resolve_folder_id(self, folder_name: Optional[str] = None) -> Optional[str]:
        """
        Finds or creates a Google Drive folder. If folder_id is already set in config,
        returns that directly.
        """
        if self.config.folder_id:
            return self.config.folder_id

        target_name = folder_name or self.config.folder_name
        if not target_name:
            return None

        try:
            query = (
                f"name = '{target_name}' and "
                "mimeType = 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
            res = self.service.files().list(
                q=query, spaces="drive", fields="files(id, name)"
            ).execute()
            folders = res.get("files", [])

            if folders:
                fid = folders[0]["id"]
                print(f"📁 [DriveClient] Found folder '{target_name}' (ID: {fid})")
                return fid

            # Create if it doesn't exist
            meta = {
                "name": target_name,
                "mimeType": "application/vnd.google-apps.folder",
            }
            folder = self.service.files().create(body=meta, fields="id").execute()
            fid = folder["id"]
            print(f"📁 [DriveClient] Created new folder '{target_name}' (ID: {fid})")
            return fid

        except Exception as e:
            print(f"⚠️ [DriveClient] Folder lookup error ({e}). Using root/global.")
            return None

    def list_images(
        self,
        folder_id: Optional[str] = None,
        page_size: int = 20,
        order_by: str = "modifiedTime desc",
    ) -> List[Dict[str, Any]]:
        """
        Lists image files in the target folder, sorted by modification time.
        """
        query_parts = ["trashed = false"]

        # MIME type filter
        mime_conditions = " or ".join(
            [f"mimeType = '{m}'" for m in self.config.allowed_mime_types]
        )
        query_parts.append(f"({mime_conditions})")

        if folder_id:
            query_parts.append(f"'{folder_id}' in parents")

        query = " and ".join(query_parts)

        try:
            res = self.service.files().list(
                q=query,
                orderBy=order_by,
                pageSize=page_size,
                fields="files(id, name, mimeType, size, modifiedTime, createdTime)",
            ).execute()
            return res.get("files", [])
        except Exception as e:
            print(f"❌ [DriveClient] Failed to list images: {e}")
            return []

    def get_latest_image(self, folder_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fetches the single most recently modified image."""
        images = self.list_images(folder_id=folder_id, page_size=1)
        return images[0] if images else None

    def download_image(self, file_id: str) -> Tuple[Image.Image, bytes]:
        """
        Streams image directly into memory.
        Returns (PIL.Image, raw_bytes).
        """
        request = self.service.files().get_media(fileId=file_id)
        buf = io.BytesIO()
        downloader = MediaIoBaseDownload(buf, request, chunksize=1024 * 1024)

        done = False
        while not done:
            _, done = downloader.next_chunk()

        buf.seek(0)
        raw_bytes = buf.getvalue()
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        return pil_img, raw_bytes

    def download_image_to_file(self, file_id: str, dest_path: str) -> str:
        """Downloads an image file directly to a local file path."""
        os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
        _, raw_bytes = self.download_image(file_id)
        with open(dest_path, "wb") as f:
            f.write(raw_bytes)
        return dest_path
