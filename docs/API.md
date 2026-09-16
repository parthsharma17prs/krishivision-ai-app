# KrishiVision AI — REST API Reference

The KrishiVision AI backend is powered by FastAPI and exposes a comprehensive set of RESTful endpoints under `/api`.

Interactive OpenAPI documentation is available when running locally at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Endpoint Overview

### 1. System & Health
- `GET /api/health` — System health check, database connectivity, and timestamp.
- `GET /api/system/mode` — Returns current mode (`demo` or `live`), active providers, and feature flags.
- `GET /api/models/status` — Returns model registry status and architectures from `models/manifest.json`.

### 2. Authentication
- `POST /api/auth/login` — Authenticate user and receive a JWT Bearer token (`email`, `password`).
- `GET /api/auth/me` — Retrieve the currently authenticated farmer profile.

### 3. Farms & Crop Cycles
- `GET /api/farms` — List all registered farms for the authenticated user.
- `GET /api/farms/{farm_id}` — Get farm details, field plots, and crop cycle telemetry.
- `POST /api/farms` — Register a new farm plot.

### 4. Dashboard Overview
- `GET /api/dashboard/{farm_id}` — Consolidated farm health score (0-100), active alerts, soil status, weather snippet, and recent scans.

### 5. AI Diagnostics & Vision Analysis
- `POST /api/analysis/disease` — Multipart image upload for leaf diagnosis.
  - **Pipeline**: YOLOv11 leaf ROI detection + ViT Base Patch16 224 classifier (PlantDoc dataset).
  - **Output**: Top diagnoses with confidence scores, severity rating, bounding box coordinates, attention heatmap URL, and treatment advisory.
- `POST /api/analysis/pest` — Modular pest detection adapter with threshold detection.
- `POST /api/analysis/nutrient` — Multimodal assessment combining NPK levels, soil pH, crop growth stage, and observed deficiency symptoms.

### 6. Smart Irrigation Intelligence
- `GET /api/irrigation/{farm_id}` — Fetch the latest irrigation recommendation and schedule.
- `POST /api/irrigation/analyze` — Run real-time evapotranspiration and soil moisture threshold analysis.
  - **Output**: `irrigate_required: bool`, urgency level, liters per acre recommendation, and transparent reasoning.

### 7. Weather Intelligence
- `GET /api/weather/current` — Current temperature, humidity, rainfall probability, and wind speed.
- `GET /api/weather/forecast` — 7-day agricultural weather forecast with dry/wet spell indicators.

### 8. Agricultural Risk Assessment
- `GET /api/risk/{farm_id}` — Evaluates environmental hazards (Heat Wave, Drought, Waterlogging/Flood, Fungal Outbreak).
  - **Output**: Risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), factor breakdowns, and preventive mitigation advisories.

### 9. IoT Sensor Telemetry
- `POST /api/sensors/readings` — Ingest sensor telemetry (`soil_moisture_pct`, `temperature_c`, `humidity_pct`, `water_tank_pct`).
- `GET /api/sensors/{field_id}/history` — Retrieve historical telemetry time series.

### 10. AI Farmer Assistant
- `POST /api/assistant/chat` — Multilingual conversational assistant supporting English, Hindi, and Hinglish.
  - Queries are processed against an agricultural domain knowledge base to provide non-hallucinating advice on crop diseases, pest control, and irrigation.

### 11. Field Diagnostic Reports
- `POST /api/reports?farm_id={farm_id}` — Generate a downloadable PDF report summarizing recent telemetry, leaf diagnoses, heatmaps, and advisories.
- `GET /api/reports/{report_id}/download` — Stream the generated PDF report.
