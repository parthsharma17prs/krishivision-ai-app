# System Architecture & Database ERD — KrishiVision AI

## System Architecture Diagram

```
                       +-----------------------------------+
                       |    React 19 + TypeScript + Vite   |
                       |       AgriTech Dashboard UI       |
                       +-----------------+-----------------+
                                         |
                                         v  REST API / SSE
                       +-----------------+-----------------+
                       |         Python FastAPI App        |
                       |       (Application Server)        |
                       +--------+-----------------+--------+
                                |                 |
          +---------------------+                 +---------------------+
          |                                                             |
          v                                                             v
+---------+----------+                                       +----------+---------+
|  ML Model Adapters |                                       | Business Engines   |
|                    |                                       |                    |
| - DiseaseAdapter   |                                       | - IrrigationEngine |
|   (YOLOv11 + ViT)  |                                       | - RiskEngine       |
| - PestAdapter      |                                       | - WeatherProvider  |
| - NutrientAdapter  |                                       | - AssistantService |
| - Fallback Heatmap |                                       | - ReportGenerator  |
+---------+----------+                                       +----------+---------+
          |                                                             |
          +---------------------+                 +---------------------+
                                |                 |
                                v                 v
                       +--------+-----------------+--------+
                       |    PostgreSQL / SQLite Database   |
                       |      (SQLAlchemy ORM + Seed)      |
                       +-----------------------------------+
```

---

## Data Flow Architecture

1. **User Request / Image Upload**:
   - The React frontend validates image mime type (JPEG/PNG/WebP) and file size (<= 10MB).
   - Direct POST request sent to `/api/analysis/disease`.
2. **ML Inference Pipeline**:
   - FastAPI receives image -> passes to `DiseaseModelAdapter`.
   - In `REAL_MODEL` mode: YOLOv11 locates leaf ROI, crops, ViT predicts disease class & generates Grad-CAM attention heatmap.
   - In `DEMO` mode: Synthetic visual annotation generator highlights leaf ROI with bounding box and renders attention heatmap overlay.
   - Prediction results return top-3 candidates, confidence %, severity rating, and advisory actions.
3. **Smart Irrigation Calculation**:
   - Soil moisture telemetry from IoT Simulator or ESP32 endpoint (`/api/sensors/readings`).
   - Combined with `WeatherProvider` forecast (temp, humidity, rain probability) & crop stage demand.
   - `SmartIrrigationEngine` outputs `irrigate_required: bool`, recommended window, liters per acre, and transparent reasoning.
4. **Risk Assessment**:
   - Combines historical weather, moisture trend, crop stage, and disease scan count.
   - Evaluates drought, flood, heat wave, cold snap, water stress, disease outbreak, and pest outbreak levels (LOW, MEDIUM, HIGH, CRITICAL).
5. **AI Farmer Assistant**:
   - Accepts prompts in English, Hindi, or Hinglish.
   - Maps user query against structured Agricultural Knowledge Base (crop stages, disease symptoms, NPK guidelines, irrigation rules).
   - Generates advisory response without hallucinating specific chemical dosages.
6. **PDF Report Generation**:
   - `/api/reports` bundles farm telemetry, recent disease scan, heatmap, irrigation window, and risk alerts into a structured PDF document.

---

## Database ERD & Schema Definitions

The application uses SQLAlchemy models with foreign key constraints, explicit timestamps (`created_at`, `updated_at`), and indexed lookups (`farm_id`, `field_id`, `crop_cycle_id`, `created_at`).

### Table Relationships
- `users` (1) ---> (N) `farms`
- `farms` (1) ---> (N) `fields`
- `fields` (1) ---> (N) `crop_cycles`
- `fields` (1) ---> (N) `sensor_readings`
- `crop_cycles` (1) ---> (N) `plant_scans`
- `crop_cycles` (1) ---> (N) `irrigation_events`
- `crop_cycles` (1) ---> (N) `risk_assessments`
- `farms` (1) ---> (N) `alerts`
- `farms` (1) ---> (N) `reports`
