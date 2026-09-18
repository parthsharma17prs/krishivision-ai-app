"""
Command-line interface for testing and running the Google Drive ML pipeline.
"""

import argparse
import sys
import os

from .adapters import LogOnlyAdapter, PlantDoctorAdapter
from .auth import DriveAuth
from .config import DriveConfig
from .pipeline import DriveImagePipeline


def main():
    parser = argparse.ArgumentParser(
        description="Google Drive Ingestion & ML Model Pipeline CLI"
    )
    parser.add_argument(
        "--test-auth",
        action="store_true",
        help="Test Google Drive credentials, connection, and folder resolution.",
    )
    parser.add_argument(
        "--poll-once",
        action="store_true",
        help="Perform a single polling check for new images.",
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Run continuous watcher loop polling Google Drive.",
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        default=5.0,
        help="Seconds between Drive polling cycles (default: 5.0).",
    )
    parser.add_argument(
        "--folder-name",
        type=str,
        default="Agribotimage",
        help="Name of Google Drive folder to watch (default: Agribotimage).",
    )
    parser.add_argument(
        "--filter-by-folder",
        action="store_true",
        help="Strictly filter by the specified folder (default: ingests all images accessible to app).",
    )
    parser.add_argument(
        "--save-local",
        action="store_true",
        help="Persist copies of downloaded images to disk.",
    )
    parser.add_argument(
        "--use-model",
        choices=["log", "plantdoctor"],
        default="log",
        help="Choose ML model adapter: 'log' for info only, or 'plantdoctor' for existing ML project.",
    )
    parser.add_argument(
        "--project-path",
        type=str,
        default="/Users/macbook/Desktop/Projects/projeect_suas",
        help="Path to existing ML project (used by plantdoctor adapter).",
    )

    args = parser.parse_args()

    config = DriveConfig(
        folder_name=args.folder_name,
        filter_by_folder=args.filter_by_folder,
        poll_interval=args.poll_interval,
        save_local=args.save_local,
    )

    if args.test_auth:
        print("🔍 Testing Google Drive connection...")
        auth = DriveAuth(config)
        service = auth.get_service()
        about = service.about().get(fields="user(displayName, emailAddress)").execute()
        user = about.get("user", {})
        print(f"✅ Authenticated successfully as: {user.get('displayName')} ({user.get('emailAddress')})")
        return

    # Select model adapter
    if args.use_model == "plantdoctor":
        adapter = PlantDoctorAdapter(project_path=args.project_path)
    else:
        adapter = LogOnlyAdapter()

    pipeline = DriveImagePipeline(config=config, model=adapter)

    if args.poll_once:
        print("🔍 Checking Google Drive once for new images...")
        results = pipeline.poll_once()
        print(f"✅ Finished! Processed {len(results)} new image(s).")
    elif args.watch:
        pipeline.watch()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
