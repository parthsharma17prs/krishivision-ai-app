# Reference Repository Analysis & Architectural Synthesis

This document analyzes the four reference repositories provided for building **KrishiVision AI**. It outlines what concepts, architectures, models, and logic are extracted, what is modified, and how they combine into a unified production-grade architecture.

---

## 1. Aarpan-Garg/plant-disease-detection
- **Purpose**: Plant disease image analysis & 2-stage detection pipeline.
- **Key Concepts Extracted**:
  - **Pipeline**: Two-stage architecture where YOLOv11 detects leaf/affected regions and extracts bounding boxes, followed by ViT (Vision Transformer) Base Patch16 224 for fine-grained disease classification.
  - **Dataset Structure**: PlantDoc dataset coverage (30 classes across 13 plant species).
  - **Explainability**: Model attention visualization / heatmap generation and top-k confidence scoring.
  - **FastAPI Integration**: Asynchronous image inference service pattern.
- **Design Adaptations**:
  - Supported classes are explicitly exposed via API metadata to prevent false claims on unsupported crops/diseases.
  - Dual-mode execution (`REAL_MODEL` with local weights, `DEMO` model adapter when weights are missing) with clear tagging.
  - Fallback visualizer generates synthetic attention heatmaps and bounding boxes when running in DEMO mode so UI preview is 100% functional.

---

## 2. nithu0035/smart-irrigation-system-with-weather-aware-crop-guidance
- **Purpose**: Soil moisture analysis & weather-aware irrigation recommendation.
- **Key Concepts Extracted**:
  - **Irrigation Variables**: Soil moisture thresholding, crop stage water requirement multiplier, rainfall probability impact, evapotranspiration factors.
  - **ML Models**: Random Forest / XGBoost decision logic for automated irrigation window estimation.
- **Design Adaptations**:
  - Replaced Streamlit frontend with unified React 19 + TypeScript dashboard.
  - Exposed ML/rule-based scheduling logic through a clean REST service (`SmartIrrigationEngine`).
  - Implemented transparent reasoning ("Do not irrigate because soil moisture is adequate and 70% rain expected").

---

## 3. IamSristi/AgroSmart
- **Purpose**: IoT hardware architecture & local/cloud sensor integration.
- **Key Concepts Extracted**:
  - **Sensor Telemetry**: Soil moisture (%), Ambient Temperature (°C), Relative Humidity (%), Water Tank Level (%).
  - **Hardware Architecture**: ESP32 / ESP8266 REST/MQTT sensor payload definitions.
- **Design Adaptations**:
  - Removed mandatory Firebase dependency; PostgreSQL serves as the primary system of record.
  - Implemented an interactive `MockSensorProvider` and IoT Simulation Panel allowing users to adjust sensor sliders and trigger real-time recalculations.
  - Modularized `SensorProvider` interface allowing seamless connection to real ESP32 hardware via REST API.

---

## 4. Pratyush-Basu/Smart-Farming-AI-Platform
- **Purpose**: End-to-end Smart Farming platform architecture.
- **Key Concepts Extracted**:
  - Multi-feature modular architecture (Disease, Irrigation, Fertilizer, Weather, Chatbot).
  - Conversational assistant interface tailored for farmer queries.
- **Design Adaptations**:
  - Structured Agri Knowledge Base backing the conversational assistant to prevent hallucinated chemical dosages.
  - Native support for multilingual prompts (English, Hindi, Hinglish).
  - Single consolidated monorepo clean architecture with Docker Compose.

---

## License & Attribution Summary
- All referenced designs and concepts are implemented from scratch using clean room software engineering principles.
- Code from reference repos is used purely for structural and algorithmic reference.
- Source attribution tags (`REAL_MODEL`, `RULE_ENGINE`, `DEMO`) are explicitly present in all API responses.
