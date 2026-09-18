# KrishiVision AI

<p align="center">
  <strong>AI-Powered Smart Farming Intelligence for Indian Agriculture</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-blue" alt="Python Version" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-009688" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/AI%2FML-YOLOv11%20%2B%20ViT%20Patch16-orange" alt="YOLOv11 + ViT" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 🌾 Overview

**KrishiVision AI** is an intelligent, field-deployable Smart Farming Assistant engineered specifically for Indian agro-climatic conditions. It empowers smallholder farmers and agricultural extension officers with early-stage crop disease detection, localized pest risk assessment, multimodal nutrient deficiency diagnosis, and weather-aware smart irrigation scheduling.

The system is designed to operate seamlessly in both online production environments and low-connectivity rural deployments via a zero-GPU fallback demo mode.

---

## 🌟 Core Features & Implementation Status

| Feature | Description | Status |
|---|---|---|
| **AI Plant Doctor** | Two-stage vision pipeline: YOLOv11 locates leaf regions of interest (ROI) and Vision Transformer (ViT Base Patch16 224) classifies disease severity on the PlantDoc benchmark (30 classes across 13 species) with Grad-CAM attention heatmaps. | `LOCAL AI` / `DEMO` |
| **Edge AI Station** | 100% on-device local runtime executing MobileNetV2 ONNX inference, asynchronous multi-engine decision tree, and SQLite offline sync queue without cloud roundtrip. | `LIVE (100% LOCAL)` |
| **Live Image Dashboard** | Automated 10-second camera/drive image ingestion pipeline running real-time pathology classification and live advisory charts. | `LIVE` |
| **Pest Detection Adapter** | Modular adapter interface for YOLO-based pest detection with real-time threshold scoring and crop-specific economic thresholds. | `DEMO` / `PLANNED` |
| **Nutrient Deficiency Analysis** | Multimodal diagnostic engine combining NPK sensor telemetry, soil pH readings, crop growth stage tables, and visual deficiency symptoms. | `LIVE` (Rule Matrix) |
| **Smart Irrigation Engine** | Evapotranspiration and weather-aware scheduling algorithm calculating required water volumes and transparent model reasoning (*"Soil moisture at 22%; irrigate within 2 hours"*). | `LIVE` |
| **Weather Intelligence** | Dual-mode weather provider supporting live OpenWeatherMap API feeds or deterministic local weather for offline simulation. | `LIVE` |
| **Agricultural Risk Engine** | Evaluates real-time risk levels (LOW, MEDIUM, HIGH, CRITICAL) for Heat Waves, Drought, Waterlogging/Floods, and Fungal Outbreaks. | `LIVE` |
| **IoT Telemetry Simulator** | Interactive sensor testing panel allowing live manipulation of Soil Moisture, Temperature, Humidity, and Water Tank levels with real-time recalculated advisories. | `LIVE` |
| **AI Farmer Assistant** | Conversational domain bot supporting **English**, **Hindi**, and **Hinglish** queries backed by a structured agricultural knowledge base to prevent hallucinations. | `LIVE` / `LOCAL AI` |
| **PDF Diagnostic Reports** | Automated generation of comprehensive field diagnostic reports using ReportLab, bundling telemetry history, leaf scan heatmaps, and mitigation steps. | `LIVE` |
| **Hardware REST Telemetry** | Clean REST endpoint interface ready to accept live sensor readings from physical ESP32 / ESP8266 microcontroller nodes. | `LIVE` |

> **Status Glossary:**
> - `LIVE`: Fully implemented, verified, and operational out of the box.
> - `LOCAL AI`: Uses local deep learning models or rule engines; synthetic fallback active when weights are absent.
> - `DEMO`: Functional mock adapter providing realistic responses for demonstration.
> - `PLANNED`: Interface defined; ready for custom field model weights.

---

## 🏗️ Architecture

```
                                  +---------------------------------------+
                                  |     React 19 + TypeScript + Vite      |
                                  |   (Tailwind CSS + Recharts UI)        |
                                  +-------------------+-------------------+
                                                      |
                                                      v  HTTP / REST (/api)
                                  +-------------------+-------------------+
                                  |        FastAPI Application Server     |
                                  |    (Pydantic v2 + JWT Auth + CORS)    |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +----------------------+
                     |                                                                 |
                     v                                                                 v
          +----------+----------+                                           +----------+----------+
          |   AI / ML Adapters  |                                           |   Business Engines  |
          |                     |                                           |                     |
          | - Disease (YOLO+ViT)|                                           | - Irrigation Engine |
          | - Pest Adapter      |                                           | - Risk Engine       |
          | - Nutrient Engine   |                                           | - Weather Service   |
          | - Grad-CAM Visualizer                                           | - Assistant Service |
          +----------+----------+                                           | - Report Generator  |
                     |                                                      +----------+----------+
                     +----------------------+                   +----------------------+
                                            |                   |
                                            v                   v
                                  +---------+-------------------+---------+
                                  |        SQLAlchemy Database Layer      |
                                  |  (SQLite / PostgreSQL / Firebase)     |
                                  +---------------------------------------+
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite 5.4
- **Styling**: Tailwind CSS 3.4, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (ASGI)
- **Server**: Uvicorn
- **ORM & Database**: SQLAlchemy, SQLite (default), PostgreSQL / Firebase ready
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Authentication**: JWT (JOSE) + Passlib (Bcrypt)
- **PDF Generation**: ReportLab
- **Image Processing**: Pillow, OpenCV, NumPy

### Machine Learning
- **Detection**: YOLOv11 leaf ROI localization
- **Classification**: Vision Transformer (ViT Base Patch16 224) on PlantDoc dataset
- **Explainability**: Synthetic & PyTorch Grad-CAM attention visualizers

---

## 📁 Project Structure

```
krishivision-ai/
├── frontend/                     # React 19 + TypeScript frontend
│   ├── src/
│   │   ├── api/                  # Axios API client and endpoint bindings
│   │   ├── components/layout/    # Navbar, Sidebar, and MobileNav
│   │   ├── features/             # Feature views (Dashboard, Disease, Irrigation, etc.)
│   │   ├── layouts/              # Main AppLayout wrapper
│   │   └── types/                # TypeScript interfaces and API schemas
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── api/                  # REST route handlers (11 modules)
│   │   ├── core/                 # App configuration & JWT security
│   │   ├── db/                   # Database session & Firebase connector
│   │   ├── ml/                   # Model adapters (Disease, Pest, Nutrient)
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # Core business engines (Irrigation, Risk, Weather, PDF)
│   ├── tests/                    # Pytest test suite
│   ├── main.py                   # FastAPI application entry point
│   ├── requirements.txt          # Python package dependencies
│   └── firebase-credentials.example.json
├── data/
│   └── seeds/                    # Database seeder (seed_demo_data.py)
├── docker/
│   ├── Dockerfile.backend        # Backend container definition
│   └── Dockerfile.frontend       # Frontend container definition
├── docs/                         # Project documentation
│   ├── API.md                    # Detailed REST API specification
│   ├── ENVIRONMENT.md            # Environment configuration guide
│   ├── HACKATHON_DEMO.md         # 5-minute hackathon walkthrough script
│   ├── repository-analysis.md    # Reference repo analysis & architectural synthesis
│   └── architecture/             # System diagrams and database ERD
├── models/
│   └── manifest.json             # AI model registry manifest
├── scripts/
│   ├── check_models.py           # Model manifest verifier
│   ├── download_models.py        # Model weight downloader
│   └── smoke_test.py             # E2E system smoke test suite
├── .env.example                  # Environment template
├── .gitignore                    # Git exclusion rules
├── docker-compose.yml            # Multi-container orchestration
├── start.bat                     # Windows 1-click launch script
└── start.sh                      # Linux/macOS 1-click launch script
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.10+ (tested up to Python 3.14)
- **npm** or **yarn**

---

### Method 1: 1-Click Launch Scripts

#### Windows
Double-click `start.bat` or run:
```cmd
start.bat
```

#### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

---

### Method 2: Manual Local Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/PranavSethia/KrishiVision-AI.git
cd KrishiVision-AI
```

#### Step 2: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python ../data/seeds/seed_demo_data.py
python main.py
```
Backend will start on: **`http://localhost:8000`** (Interactive Docs: **`http://localhost:8000/docs`**).

#### Step 3: Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on: **`http://localhost:5173`**.

---

### Method 3: Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Farm Context |
|---|---|---|---|
| **Demo Farmer** | `farmer@demo.local` | `Demo@123` | 5-Acre Tomato Farm, Indore, Madhya Pradesh |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Key | Default | Description |
|---|---|---|
| `DEMO_MODE` | `true` | Enables offline demo fallback mode |
| `SECRET_KEY` | `krishivision-ai-super-secret-key-...` | JWT token secret key |
| `DATABASE_URL` | `sqlite:///./krishivision.db` | Database connection string |
| `WEATHER_PROVIDER` | `demo` | `"demo"` or `"openweather"` |
| `OPENWEATHER_API_KEY`| `""` | Optional OpenWeatherMap API key |
| `ASSISTANT_PROVIDER`| `demo` | `"demo"`, `"gemini"`, or `"openai"` |
| `LLM_API_KEY` | `""` | Optional Gemini or OpenAI API key |

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for detailed variable descriptions.

---

## 🧠 AI Models & Architecture

KrishiVision AI implements a modular model adapter framework specified in [`models/manifest.json`](models/manifest.json):

1. **Disease Detection (`models/disease_vit_yolo.pt`)**:
   - **Architecture**: YOLOv11 Leaf Detector + Vision Transformer (ViT Base Patch16 224).
   - **Dataset**: PlantDoc (30 disease classes across 13 Indian agricultural crops).
   - **Visualizer**: Grad-CAM attention heatmaps and leaf ROI bounding box extraction.
   - Run `python scripts/download_models.py` for instructions to load offline PyTorch weights.
2. **Nutrient Diagnosis**:
   - **Architecture**: Multimodal Rule Matrix assessing N, P, K, Mg, Fe, and Zn deficiencies correlated with soil pH and crop growth phases.
3. **Smart Irrigation**:
   - **Architecture**: Soil moisture deficit modeling combined with atmospheric evapotranspiration.

---

## 🌐 Multilingual Support

The **AI Farm Assistant** (`/assistant`) natively handles queries in:
- **English**
- **Hindi (हिंदी)**
- **Hinglish (Colloquial Hindi-English)**

Queries are evaluated against an agricultural domain knowledge base, ensuring safe, non-hallucinating responses with scientific disclaimers.

---

## ⚡ Edge AI Runtime (100% Local On-Device)

KrishiVision includes a dedicated, field-deployable Edge AI Runtime capable of executing **100% offline inference and autonomous decision-making** with zero cloud dependency.

### Starting the Edge AI Node
```bash
# Activate virtual environment
source venv/bin/activate

# Launch edge service on port 8001
python -m edge.app.main
```

### Running Hardware Benchmarks
```bash
python edge/tools/benchmark_model.py --iterations 30 --warmup 5
```
*Measures true capture FPS, inference latency percentiles (p50/p95), and logs verifiable results to `edge/benchmark_report.json`.*

### Edge Documentation
- [Edge Architecture Guide](docs/EDGE_ARCHITECTURE.md)
- [Offline Mode & Resilience](docs/OFFLINE_MODE.md)
- [Real-Time Pipeline Specification](docs/REALTIME_PIPELINE.md)
- [Hardware Benchmarking Guide](docs/BENCHMARKING.md)

---

## 🧪 Testing & Quality Assurance

### Backend Unit Tests (Pytest)
```bash
cd backend
python -m pytest
```
*Executes 11 test cases validating auth, dashboard, disease analysis, irrigation engine, risk evaluation, and reports.*

### Frontend Production Build Test
```bash
cd frontend
npm run build
```
*Validates TypeScript types and generates optimized production bundle.*

### End-to-End System Smoke Test
With the backend running:
```bash
python scripts/smoke_test.py
```
*Runs an 8-stage automated integration test across all core endpoints.*

---

## 🔒 Security & Privacy

- **No Secrets in Repo**: All credentials, tokens, and keys are loaded via environment variables or gitignored local configurations.
- **Database Safety**: Local SQLite databases (`*.db`) are ignored by default.
- **Upload Isolation**: User uploads and generated PDFs are kept in gitignored local storage directories.

---

## 📜 License & Attribution

This project is licensed under the [MIT License](LICENSE).