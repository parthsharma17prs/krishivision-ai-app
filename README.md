# KrishiVision AI

<p align="center">
  <strong>AI-Powered Smart Farming Intelligence & Autonomous Edge Diagnostics for Indian Agriculture</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-blue" alt="Python Version" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-009688" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/AI%2FML-YOLOv11%20%2B%20ViT%20%2B%20MobileNetV2%20ONNX-orange" alt="YOLOv11 + ViT" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 🌾 Overview

**KrishiVision AI** is an intelligent, field-deployable Smart Farming Assistant engineered specifically for Indian agro-climatic conditions. It empowers smallholder farmers and agricultural extension officers with:

- **Early-Stage Crop Pathology & Pest Detection** (ONNX / YOLOv11 + ViT Patch16)
- **Risk Analysis & Emergency SOS Escalation** (Auto-escalation countdown timer, Hold 3s to call, 1-click manual trigger, and live interactive IVR voice call interface)
- **Multimodal Nutrient Deficiency Diagnosis** (NPK + Micronutrients + Leaf visual symptoms)
- **Weather-Aware Smart Irrigation Scheduling** (Atmospheric ET + Soil moisture deficit curve)
- **Real-Time Agribot 10s Camera & Google Drive Pipeline**
- **100% Offline Edge AI Station** running local ONNX execution and async SQLite sync queue

---

## 🌟 Core Features & Implementation Status

| Feature | Description | Status |
|---|---|---|
| **AI Plant Doctor** | Two-stage vision pipeline: ONNX & YOLOv11 leaf ROI detection + Vision Transformer (ViT Base Patch16 224) disease classification with Grad-CAM heatmaps. | `LIVE` (ONNX / Rule Matrix) |
| **Agricultural Risk Analysis** | Real-time threat evaluation (Heatwaves, Drought, Pest Swarms, Waterlogging) with automated 60s countdown timer, **Hold 3s for Call Trigger**, manual call dispatch button, and live interactive IVR call modal. | `LIVE` |
| **Live Agribot Image Pipeline** | Automated 10-second field camera capture & Google Drive ingestion pipeline running real-time pathology diagnosis and historical telemetry logging. | `LIVE (10s Feed)` |
| **Google Sheets Live Sync** | Real-time 10s bidirectional sync fetching live field sensor telemetry directly from Google Sheets into the dashboard. | `LIVE` |
| **Edge AI Runtime** | 100% on-device local runtime executing MobileNetV2 ONNX inference, decision tree engine, and SQLite offline sync queue without cloud latency. | `LIVE (100% LOCAL)` |
| **Pest Detection Adapter** | YOLO-based pest detection with real-time threshold scoring, bounding box visualization, and crop-specific economic thresholds. | `LIVE` |
| **Nutrient Deficiency Analysis** | Diagnostic engine combining NPK sensor telemetry, micronutrient levels (Mg, Fe, Zn), soil pH readings, and foliar spray recipes. | `LIVE` |
| **Smart Irrigation Engine** | Evapotranspiration and weather-aware scheduling algorithm calculating required water volumes and transparent model reasoning (*"Soil moisture at 22%; irrigate within 2 hours"*). | `LIVE` |
| **Weather Intelligence** | Dual-mode weather provider supporting live OpenWeatherMap API feeds or local forecast data for offline simulation. | `LIVE` |
| **IoT Telemetry Simulator** | Interactive sensor testing panel allowing live manipulation of Soil Moisture, Temperature, Humidity, and Water Tank levels with instant advisory re-calculations. | `LIVE` |
| **AI Farmer Assistant** | Conversational domain bot supporting **English**, **Hindi**, and **Hinglish** queries backed by an agricultural domain knowledge base. | `LIVE` |
| **PDF Diagnostic Reports** | Automated generation of comprehensive field diagnostic reports using ReportLab, bundling telemetry history, leaf scan heatmaps, and mitigation steps. | `LIVE` |

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
          | - Disease (ONNX+ViT)|                                           | - Irrigation Engine |
          | - Pest Adapter      |                                           | - Risk Engine & SOS |
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
- **Image Processing**: Pillow, OpenCV, NumPy, ONNX Runtime

---

## 📁 Project Structure

```
krishivision-ai-app/
├── frontend/                     # React 19 + TypeScript frontend
│   ├── src/
│   │   ├── api/                  # Axios API client and endpoint bindings
│   │   ├── components/layout/    # Navbar, Sidebar, and MobileNav
│   │   ├── features/             # Feature views (Dashboard, Disease, Risks, Live Feed, Edge, etc.)
│   │   ├── layouts/              # AppLayout wrapper
│   │   └── types/                # TypeScript interfaces and API schemas
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── api/                  # REST route handlers
│   │   ├── core/                 # App configuration & JWT security
│   │   ├── db/                   # Database session & Firebase connector
│   │   ├── ml/                   # Model adapters & Plant Doctor ONNX engines
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # Core business engines (Risk, Irrigation, Live Feed, GSheets, PDF)
│   ├── tests/                    # Pytest test suite
│   ├── main.py                   # FastAPI application entry point
│   └── requirements.txt          # Python package dependencies
├── edge/                         # 100% Offline Edge AI Station runtime
│   ├── app/                      # Edge camera, inference, decision engine, & sync queue
│   └── tools/                    # Hardware benchmarking utilities
├── scripts/                      # Hardware & GSheets sync scripts
│   ├── esp32_krishivision.ino    # ESP32 micro-controller sensor C++ sketch
│   ├── gsheets_live_sync.py      # Google Sheets live 10s telemetry synchronizer
│   └── simulate_esp32_live.py   # Live IoT sensor telemetry stream simulator
├── .env.example                  # Environment template
└── README.md                     # Project documentation
```

---

## ⚡ Quick Start & Local Installation

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.10+ (tested up to Python 3.14)
- **npm** or **yarn**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/parthsharma17prs/krishivision-ai-app.git
cd krishivision-ai-app
```

### Step 2: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
Backend server will start on **`http://localhost:8000`** (Interactive Docs: **`http://localhost:8000/docs`**).

### Step 3: Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend development app will start on **`http://localhost:5173`**.

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Farm Context |
|---|---|---|---|
| **Demo Farmer** | `farmer@demo.local` | `Demo@123` | 5-Acre Tomato & Corn Farm, Indore, MP |

---

## 🚨 Risk Analysis & SOS Call Trigger Workflow

1. Navigate to **Risk Analysis** (`/risks`).
2. Review identified farm risks (e.g. *Heatwave Stress*, *Soil Moisture Deficit*).
3. **Escalation Countdown Timer**: Counts down 60 seconds before an automatic emergency call dispatch.
4. **Hold 3s for Call Trigger**: Press and hold the emergency button for 3 seconds (displaying a real-time countdown progress bar inside the button) to trigger the call immediately.
5. **1-Click Call Fallback**: Click to trigger instant connection.
6. **Live IVR Call Interface**: Opens an interactive in-call modal with Dr. Ramesh Sharma (Senior Agronomist), live timer, audio waveform animation, telemetry transcript, and Mute/Speaker/Hangup controls.

---

## 🧪 Testing & Quality Assurance

### Backend Unit Tests (Pytest)
```bash
cd backend
python -m pytest
```

### Frontend Production Build Test
```bash
cd frontend
npm run build
```

---

## 📜 License & Attribution

This project is licensed under the [MIT License](LICENSE).
- **No Secrets in Repo**: All credentials, tokens, and keys are loaded via environment variables or gitignored local configurations.
- **Database Safety**: Local SQLite databases (`*.db`) are ignored by default.
- **Upload Isolation**: User uploads and generated PDFs are kept in gitignored local storage directories.

---

## 📜 License & Attribution

This project is licensed under the [MIT License](LICENSE).