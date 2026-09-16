import os
import sys

def check():
    print("=" * 60)
    print("  KrishiVision AI — Model Manifest Inspector")
    print("=" * 60)

    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models"))
    disease_weight = os.path.join(models_dir, "disease_vit_yolo.pt")

    disease_status = "READY (LOCAL PyTorch Weights)" if os.path.exists(disease_weight) else "DEMO (Fallback Visualizer Ready)"
    pest_status = "DEMO (Adapter Interface Active)"
    nutrient_status = "DEMO (Rule-Based Matrix Active)"

    print(f"\nDisease model:  {disease_status}")
    print(f"Pest model:     {pest_status}")
    print(f"Nutrient model: {nutrient_status}")
    print("\n[OK] Model manifest status check completed.")

if __name__ == "__main__":
    check()
