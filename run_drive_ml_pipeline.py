#!/usr/bin/env python3
"""
Live Google Drive Ingestion Worker for ML Model
"""
import sys
import os

# Add local project root
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)

from drive_pipeline import DriveImagePipeline, DriveConfig, PlantDoctorAdapter

if __name__ == "__main__":
    print("🚀 Starting Drive -> ML Model Ingestion Pipeline...")
    
    # 1. Initialize ML Model Adapter
    adapter = PlantDoctorAdapter(project_path=PROJECT_DIR)
    
    # 2. Configure Google Drive Watcher
    config = DriveConfig(
        folder_name="Agribotimage",
        poll_interval=5.0,
        save_local=True,
        save_dir=os.path.join(PROJECT_DIR, "data", "drive_inbox"),
    )
    
    # 3. Start Pipeline
    pipeline = DriveImagePipeline(config=config, model=adapter)
    pipeline.watch()
