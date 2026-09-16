import os
import json

def main():
    print("=" * 60)
    print("  KrishiVision AI — Model Weight Downloader")
    print("=" * 60)
    
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models"))
    os.makedirs(models_dir, exist_ok=True)

    print(f"\n[INFO] Target model directory: {models_dir}")
    print("[INFO] Checking model weight manifests...")

    manifest_path = os.path.join(models_dir, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
        print("\nManifest Content:")
        print(json.dumps(manifest, indent=2))
    
    print("\n[DOWNLOAD INSTRUCTIONS]")
    print("To install PyTorch disease weights from reference repository (Aarpan-Garg/plant-disease-detection):")
    print("1. Download 'disease_vit_yolo.pt' from HuggingFace / GitHub Release")
    print(f"2. Save file to: {models_dir}/disease_vit_yolo.pt")
    print("\n[NOTE] System runs in DEMO/HYBRID mode with synthetic attention heatmap generation if weights are not present.")

if __name__ == "__main__":
    main()
