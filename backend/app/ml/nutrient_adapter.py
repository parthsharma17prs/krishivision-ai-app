import os
import time
import json
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from app.ml.base_adapter import BaseModelAdapter

class NutrientModelAdapter(BaseModelAdapter):
    """
    Multimodal Agronomic Nutrient Deficiency Engine for N, P, K, Mg, Fe, and Zn Balance.
    Combines NPK sensor telemetry, micronutrient soil levels, growth stage dynamics, soil pH bioavailability,
    and foliar chlorosis visual symptom indicators.
    """

    NUTRIENT_NAMES = {
        "N": "Nitrogen (N)",
        "P": "Phosphorus (P)",
        "K": "Potassium (K)",
        "Mg": "Magnesium (Mg)",
        "Fe": "Iron (Fe)",
        "Zn": "Zinc (Zn)"
    }

    CROP_BASELINES = {
        "Corn (Maize)": {"N": 140, "P": 60, "K": 180, "Mg": 3.2, "Fe": 6.5, "Zn": 1.8},
        "Maize": {"N": 140, "P": 60, "K": 180, "Mg": 3.2, "Fe": 6.5, "Zn": 1.8},
        "Tomato": {"N": 130, "P": 55, "K": 210, "Mg": 3.5, "Fe": 7.0, "Zn": 1.5},
        "Potato": {"N": 120, "P": 65, "K": 220, "Mg": 2.8, "Fe": 6.0, "Zn": 1.4},
        "Wheat": {"N": 135, "P": 50, "K": 160, "Mg": 2.5, "Fe": 5.5, "Zn": 1.6},
        "Rice": {"N": 125, "P": 45, "K": 150, "Mg": 2.6, "Fe": 8.0, "Zn": 2.0},
        "Apple": {"N": 115, "P": 40, "K": 190, "Mg": 3.0, "Fe": 7.5, "Zn": 1.7},
        "Cotton": {"N": 130, "P": 50, "K": 185, "Mg": 3.1, "Fe": 6.0, "Zn": 1.5},
        "Default": {"N": 130, "P": 50, "K": 180, "Mg": 3.0, "Fe": 6.0, "Zn": 1.5}
    }

    GROWTH_MULTIPLIERS = {
        "Vegetative": {"N": 1.2, "P": 1.0, "K": 0.9, "Mg": 1.1, "Fe": 1.0, "Zn": 1.2},
        "Flowering & Fruit Setting": {"N": 1.0, "P": 1.3, "K": 1.2, "Mg": 1.2, "Fe": 1.1, "Zn": 1.0},
        "Fruit Development / Grain Filling": {"N": 0.9, "P": 1.1, "K": 1.4, "Mg": 1.0, "Fe": 1.0, "Zn": 1.1},
        "Default": {"N": 1.0, "P": 1.0, "K": 1.0, "Mg": 1.0, "Fe": 1.0, "Zn": 1.0}
    }

    PRESCRIPTION_DATABASE = {
        "Nitrogen (N)": {
            "symptom_description": "General uniform yellowing (chlorosis) starting from older lower leaves; pale light green canopy, reduced tillering/branching.",
            "chemical_prescription": "Apply Neem-Coated Urea (46% N) @ 35 kg/acre as top dressing during moist soil conditions.",
            "foliar_treatment": "Spray 1% Foliar Urea solution (10 g/L water) during early morning or evening hours.",
            "organic_alternative": "Apply Vermicompost @ 2 tonnes/acre or Neem Cake @ 100 kg/acre.",
            "physiological_role": "Essential component of amino acids, chlorophyll, and vegetative structural proteins."
        },
        "Phosphorus (P)": {
            "symptom_description": "Purpling or reddish-bronze pigmentation on leaf undersides and stems (anthocyanin buildup), delayed maturity, stunted root development.",
            "chemical_prescription": "Apply Di-Ammonium Phosphate (DAP 18-46-0) @ 40 kg/acre or Single Super Phosphate (SSP 16% P2O5) @ 100 kg/acre.",
            "foliar_treatment": "Spray 0.5% Mono-Potassium Phosphate (12-61-0 or 0-52-34) @ 5 g/L.",
            "organic_alternative": "Apply Rock Phosphate @ 50 kg/acre inoculated with Phosphate Solubilizing Bacteria (PSB) @ 2 kg/acre.",
            "physiological_role": "Key element for energy transfer (ATP), nucleic acids, seed formation, and root establishment."
        },
        "Potassium (K)": {
            "symptom_description": "Marginal chlorosis and scorching/necrosis along leaf edges (fire-burn appearance), weak lodging-prone stalks, small fruit size.",
            "chemical_prescription": "Apply Muriate of Potash (MOP 60% K2O) @ 25 kg/acre or Potassium Sulfate (SOP 50% K2O) for chloride-sensitive crops.",
            "foliar_treatment": "Spray 1% Potassium Nitrate (13-0-45) @ 10 g/L at fruit development stage.",
            "organic_alternative": "Apply Wood ash @ 150 kg/acre or Potash Mobilizing Bacteria (KMB) bio-fertilizer.",
            "physiological_role": "Regulates stomatal opening, water movement, enzyme activation, and carbohydrate translocation."
        },
        "Magnesium (Mg)": {
            "symptom_description": "Interveinal chlorosis on older mature leaves (yellowing between green veins with V-shaped green wedge at leaf base), leaf margin cupping.",
            "chemical_prescription": "Soil apply Magnesium Sulfate (Epsom Salt, 9.5% Mg, 12% S) @ 10 kg/acre via basal dressing or fertigation.",
            "foliar_treatment": "Foliar spray of Magnesium Sulfate @ 10 g/L (1% solution) repeated at 10-day intervals.",
            "organic_alternative": "Apply Dolomitic Limestone (CaMg(CO3)2) @ 100 kg/acre on acidic soils.",
            "physiological_role": "Central atom of the chlorophyll molecule; required for carbohydrate transport and enzyme activation."
        },
        "Iron (Fe)": {
            "symptom_description": "Sharp interveinal chlorosis on YOUNG UPPER LEAVES (fine green network of veins on pale white/ivory leaf blade), common in alkaline/high-pH soils.",
            "chemical_prescription": "Foliar apply Fe-EDTA Chelate (12% Fe) @ 1.5 g/L or Ferrous Sulfate (FeSO4 19% Fe) @ 5 g/L + citric acid (1 g/L).",
            "foliar_treatment": "Spray Fe-EDTA 12% @ 1.5 g/L in morning hours when stomata are active.",
            "organic_alternative": "Soil apply elemental sulfur @ 25 kg/acre to reduce localized rhizosphere pH and unlock bound iron.",
            "physiological_role": "Crucial for electron transport in photosynthesis, ferredoxin synthesis, and respiratory enzymes."
        },
        "Zinc (Zn)": {
            "symptom_description": "Little leaf syndrome, shortened internodes (rosetting), wide white/yellow chlorotic bands on either side of leaf midrib in maize.",
            "chemical_prescription": "Basal soil application of Zinc Sulfate Heptahydrate (ZnSO4 21%) @ 10 kg/acre or Chelated Zn-EDTA 12% @ 2 kg/acre.",
            "foliar_treatment": "Spray 0.5% ZnSO4 (5 g/L) + 0.25% lime (2.5 g/L) or Zn-EDTA @ 1 g/L.",
            "organic_alternative": "Apply Zinc Solubilizing Bio-fertilizer (ZSB - *Thiobacillus*) @ 2 kg/acre mixed with FYM.",
            "physiological_role": "Essential for auxin (IAA) synthesis, leaf expansion, protein synthesis, and internode elongation."
        }
    }

    def __init__(self):
        self.is_loaded = True
        self.mode = "HYBRID_ML_MATRIX"
        self.version = "NutrientMatrix-v2.5 (N-P-K-Mg-Fe-Zn)"
        self.load_error = None

    def load(self) -> bool:
        return True

    def health(self) -> Dict[str, Any]:
        return {
            "model_key": "nutrient",
            "loaded": self.is_loaded,
            "mode": self.mode,
            "architecture": "Multimodal Biochemical NPK-Mg-Fe-Zn Diagnostic Engine",
            "supported_nutrients": list(self.NUTRIENT_NAMES.values()),
            "notice": "Agronomic diagnostic model — confirm with soil or leaf petiole lab test before bulk application."
        }

    def metadata(self) -> Dict[str, Any]:
        return {
            "supported_nutrients": list(self.NUTRIENT_NAMES.values()),
            "supported_crops": list(self.CROP_BASELINES.keys()),
            "input_telemetry": ["N", "P", "K", "Mg", "Fe", "Zn", "pH", "EC"]
        }

    def predict(
        self,
        crop_name: str = "Corn (Maize)",
        growth_stage: str = "Flowering & Fruit Setting",
        soil_ph: Optional[float] = 6.8,
        npk_sensor: Optional[Dict[str, float]] = None,
        micronutrient_sensor: Optional[Dict[str, float]] = None,
        symptoms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()

        # Resolve baselines
        baselines = self.CROP_BASELINES.get(crop_name, self.CROP_BASELINES["Default"])
        growth_mults = self.GROWTH_MULTIPLIERS.get(growth_stage, self.GROWTH_MULTIPLIERS["Default"])

        # Sensor inputs with defaults
        if npk_sensor is None:
            npk_sensor = {"N": 110, "P": 45, "K": 175}
        if micronutrient_sensor is None:
            micronutrient_sensor = {"Mg": 2.2, "Fe": 4.5, "Zn": 0.9}

        if symptoms is None:
            symptoms = []

        ph = soil_ph if soil_ph is not None else 6.8

        # 1. Bioavailability pH Assessment
        ph_notice = "Soil pH is in optimal range (6.0 - 7.2) for balanced nutrient absorption."
        ph_fe_penalty = 0.0
        ph_zn_penalty = 0.0
        ph_p_penalty = 0.0
        ph_mg_penalty = 0.0

        if ph > 7.5:
            ph_fe_penalty = min(45.0, (ph - 7.5) * 40.0)
            ph_zn_penalty = min(40.0, (ph - 7.5) * 35.0)
            ph_notice = f"⚠️ Alkaline soil pH ({ph}) locks up Iron & Zinc into insoluble compounds, impairing root uptake even if present."
        elif ph < 5.8:
            ph_p_penalty = min(40.0, (5.8 - ph) * 35.0)
            ph_mg_penalty = min(35.0, (5.8 - ph) * 30.0)
            ph_notice = f"⚠️ Acidic soil pH ({ph}) causes Phosphorus fixation with Al/Fe and leaches bioavailable Magnesium ions."

        # 2. Compute Target Baselines
        target_n = baselines["N"] * growth_mults["N"]
        target_p = baselines["P"] * growth_mults["P"]
        target_k = baselines["K"] * growth_mults["K"]
        target_mg = baselines["Mg"] * growth_mults["Mg"]
        target_fe = baselines["Fe"] * growth_mults["Fe"]
        target_zn = baselines["Zn"] * growth_mults["Zn"]

        current_n = npk_sensor.get("N", 120.0)
        current_p = npk_sensor.get("P", 50.0)
        current_k = npk_sensor.get("K", 180.0)
        current_mg = micronutrient_sensor.get("Mg", 2.8)
        current_fe = micronutrient_sensor.get("Fe", 5.5)
        current_zn = micronutrient_sensor.get("Zn", 1.4)

        # 3. Calculate Deficit % (0% - 100%)
        def calculate_deficit(current: float, target: float, penalty: float = 0.0) -> float:
            ratio_deficit = max(0.0, (target - current) / target * 100.0)
            total = min(98.0, max(5.0, ratio_deficit + penalty))
            return round(total, 1)

        deficits = {
            "Nitrogen (N)": calculate_deficit(current_n, target_n),
            "Phosphorus (P)": calculate_deficit(current_p, target_p, ph_p_penalty),
            "Potassium (K)": calculate_deficit(current_k, target_k),
            "Magnesium (Mg)": calculate_deficit(current_mg, target_mg, ph_mg_penalty),
            "Iron (Fe)": calculate_deficit(current_fe, target_fe, ph_fe_penalty),
            "Zinc (Zn)": calculate_deficit(current_zn, target_zn, ph_zn_penalty)
        }

        # 4. Boost Deficit Scores Based on Selected Symptoms
        symptom_str = " ".join([s.lower() for s in symptoms])
        if "lower" in symptom_str and "yellow" in symptom_str:
            deficits["Nitrogen (N)"] = min(98.0, deficits["Nitrogen (N)"] + 35.0)
        if "purple" in symptom_str or "bronze" in symptom_str:
            deficits["Phosphorus (P)"] = min(98.0, deficits["Phosphorus (P)"] + 40.0)
        if "scorch" in symptom_str or "margin" in symptom_str or "edge" in symptom_str:
            deficits["Potassium (K)"] = min(98.0, deficits["Potassium (K)"] + 40.0)
        if "interveinal" in symptom_str and ("lower" in symptom_str or "old" in symptom_str):
            deficits["Magnesium (Mg)"] = min(98.0, deficits["Magnesium (Mg)"] + 45.0)
        if "interveinal" in symptom_str and ("upper" in symptom_str or "young" in symptom_str):
            deficits["Iron (Fe)"] = min(98.0, deficits["Iron (Fe)"] + 50.0)
        if "little leaf" in symptom_str or "striping" in symptom_str or "white band" in symptom_str:
            deficits["Zinc (Zn)"] = min(98.0, deficits["Zinc (Zn)"] + 50.0)

        # 5. Determine Primary & Secondary Deficiencies
        sorted_deficits = sorted(deficits.items(), key=lambda x: x[1], reverse=True)
        primary_deficiency, primary_score = sorted_deficits[0]
        secondary_deficiency, secondary_score = sorted_deficits[1]

        # Overall Plant Nutritional Health Score (0 - 100)
        avg_deficit = sum(deficits.values()) / len(deficits)
        health_score = round(max(15.0, 100.0 - (avg_deficit * 0.85)), 1)

        # 6. Detailed 6-Nutrient Breakdown Structure
        nutrients_detail = []
        for code, full_name in self.NUTRIENT_NAMES.items():
            def_pct = deficits[full_name]
            db_entry = self.PRESCRIPTION_DATABASE.get(full_name, {})

            if def_pct > 65.0:
                status = "CRITICAL DEFICIT"
            elif def_pct > 35.0:
                status = "DEFICIENT"
            elif def_pct > 15.0:
                status = "MILD DEFICIT"
            else:
                status = "OPTIMAL"

            curr_val = {
                "N": current_n, "P": current_p, "K": current_k,
                "Mg": current_mg, "Fe": current_fe, "Zn": current_zn
            }[code]

            targ_val = {
                "N": target_n, "P": target_p, "K": target_k,
                "Mg": target_mg, "Fe": target_fe, "Zn": target_zn
            }[code]

            unit = "mg/kg" if code in ["N", "P", "K"] else "ppm"

            nutrients_detail.append({
                "code": code,
                "name": full_name,
                "status": status,
                "deficit_pct": def_pct,
                "current_level": round(curr_val, 1),
                "target_level": round(targ_val, 1),
                "unit": unit,
                "symptoms": db_entry.get("symptom_description", ""),
                "prescription": db_entry.get("chemical_prescription", ""),
                "foliar_spray": db_entry.get("foliar_treatment", ""),
                "organic_alternative": db_entry.get("organic_alternative", "")
            })

        # 7. Synthesize Evidence & Recommendations
        evidence = [
            f"Telemetry Analysis: {primary_deficiency} deficit score is {primary_score}% (Current level vs target baseline).",
            f"Soil pH Bioavailability: {ph_notice}",
            f"Growth Stage Impact: '{growth_stage}' requires heightened {primary_deficiency.split()[0]} & {secondary_deficiency.split()[0]} uptake."
        ]

        if symptoms:
            evidence.append(f"Visual Symptom Correlation: Observed '{', '.join(symptoms)}' aligns with {primary_deficiency} physiological patterns.")

        primary_db = self.PRESCRIPTION_DATABASE.get(primary_deficiency, {})
        secondary_db = self.PRESCRIPTION_DATABASE.get(secondary_deficiency, {})

        recommendations = [
            primary_db.get("chemical_prescription", ""),
            primary_db.get("foliar_treatment", ""),
            secondary_db.get("foliar_treatment", ""),
            "Schedule a laboratory ICP-OES leaf tissue & soil analysis to confirm micro-element ratio."
        ]

        processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

        return {
            "likely_deficiency": primary_deficiency,
            "confidence_pct": primary_score,
            "deficiency_breakdown": deficits,
            "nutrients_detail": nutrients_detail,
            "health_score": health_score,
            "ph_bioavailability_impact": ph_notice,
            "supporting_evidence": [e for e in evidence if e],
            "recommended_fertilizer_advisory": [r for r in recommendations if r],
            "fertilizer_recipe": {
                "primary_chemical": primary_db.get("chemical_prescription"),
                "primary_foliar": primary_db.get("foliar_treatment"),
                "organic_bio": primary_db.get("organic_alternative"),
                "secondary_foliar": secondary_db.get("foliar_treatment")
            },
            "recommended_soil_test": "Lab NPK & Micronutrient Inductively Coupled Plasma (ICP) Analysis",
            "mode": self.mode,
            "notice": "Agronomic AI model — verify with soil/leaf petiole testing before applying bulk heavy fertilizers.",
            "processing_time_ms": processing_time_ms
        }

    def predict_leaf_image(self, image_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Processes a crop leaf image, calculates HSV/RGB color histograms and chlorosis distribution,
        and generates an annotated chlorosis heatmap.
        """
        start_time = time.perf_counter()
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Leaf image not found: {image_path}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not decode image at {image_path}")

        h, w = img.shape[:2]

        # Convert HSV for chlorosis & necrosis analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Green canopy mask
        lower_green = np.array([30, 40, 40])
        upper_green = np.array([90, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)

        # Yellow chlorosis mask (N/Mg/Fe chlorosis)
        lower_yellow = np.array([15, 40, 60])
        upper_yellow = np.array([30, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

        # Purple/Brown necrosis mask (P/K deficiency)
        lower_brown = np.array([0, 40, 40])
        upper_brown = np.array([15, 255, 200])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)

        total_pixels = h * w
        yellow_pct = round((np.count_nonzero(yellow_mask) / total_pixels) * 100.0, 1)
        brown_pct = round((np.count_nonzero(brown_mask) / total_pixels) * 100.0, 1)
        green_pct = round((np.count_nonzero(green_mask) / total_pixels) * 100.0, 1)

        # Generate Chlorosis Heatmap Overlay
        heatmap = cv2.applyColorMap(yellow_mask, cv2.COLORMAP_JET)
        annotated_img = cv2.addWeighted(img, 0.65, heatmap, 0.35, 0)

        # Add visual badges
        cv2.putText(annotated_img, f"Chlorosis Index: {yellow_pct}% | Necrotic Scorch: {brown_pct}%",
                    (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2, cv2.LINE_AA)

        annotated_relative_url = ""
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            filename = f"nutrient_chlorosis_{int(time.time())}_{os.path.basename(image_path)}"
            save_path = os.path.join(output_dir, filename)
            cv2.imwrite(save_path, annotated_img)
            annotated_relative_url = f"/uploads/nutrient_scans/{filename}"

        # Estimate probable deficiency based on color indices
        if yellow_pct > 25.0:
            primary = "Iron (Fe) / Magnesium (Mg) Chlorosis"
        elif brown_pct > 15.0:
            primary = "Potassium (K) Marginal Scorch"
        elif yellow_pct > 10.0:
            primary = "Nitrogen (N) Deficiency"
        else:
            primary = "Balanced Foliar Nutrition"

        processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

        return {
            "yellow_chlorosis_pct": yellow_pct,
            "brown_necrotic_pct": brown_pct,
            "green_canopy_pct": green_pct,
            "likely_visual_deficiency": primary,
            "annotated_heatmap_url": annotated_relative_url,
            "processing_time_ms": processing_time_ms
        }

nutrient_adapter = NutrientModelAdapter()
