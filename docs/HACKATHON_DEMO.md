# 5-Minute Hackathon Demo Script — KrishiVision AI

**Product**: KrishiVision AI — AI-Powered Smart Farming Intelligence for Indian Farmers  
**Demo Account**: `farmer@demo.local` / `Demo@123`  
**Demo Farm**: 5-acre Tomato farm in Indore, Madhya Pradesh  

---

## Step-by-Step 5-Minute Demo Flow

### Minute 0:00 - 0:45: Overview & Farm Health Score
1. Open dashboard at `http://localhost:5173`.
2. Highlight the **Farm Health Score** (`82/100`) and point out the score breakdown gauge (Disease Status, Irrigation Balance, Nutrient Levels, Weather Resilience).
3. Note the active crop context: **Tomato (Solanum lycopersicum)** in **Indore, MP**.

### Minute 0:45 - 2:00: AI Plant Doctor (YOLOv11 + ViT Pipeline)
1. Navigate to **AI Plant Doctor** (`/disease`).
2. Click **"Load Demo Sample Leaf"** (or upload any tomato leaf image).
3. Click **"Run AI Disease Diagnosis"**.
4. Demonstrate the 4 comparison tabs:
   - **Analysis**: Top-1 primary diagnosis (*Tomato Early Blight*, 91.4% confidence), top-3 prediction breakdown, and actionable advisory next steps.
   - **Original**: Uploaded raw leaf image.
   - **Detection**: YOLOv11 bounding box leaf ROI crop.
   - **Heatmap**: Vision Transformer Grad-CAM attention visualizer.
5. Highlight that treatment advisory comes from a structured knowledge base and is clearly tagged with scientific disclaimers.

### Minute 2:00 - 3:00: IoT Telemetry Simulator & Smart Irrigation Engine
1. Navigate to **IoT Telemetry Panel** (`/iot-simulator`).
2. Drag the **Soil Moisture (%)** slider down to `18%` and **Temperature (°C)** up to `36°C`.
3. Click **"Simulate Telemetry Reading"**.
4. Show how the backend stores the telemetry and the **Smart Irrigation Engine** instantly recalculates the recommendation (*"Immediate Irrigation Window — 1,800 L/acre drip required"*).
5. Point out the **Transparent Model Reasoning** explaining *why* irrigation is urgently recommended.

### Minute 3:00 - 4:00: Agricultural Risk Engine & Weather Intelligence
1. Navigate to **Weather Intelligence** (`/weather`) to show hyper-local rainfall probabilities and the 7-day forecast.
2. Navigate to **Risk Alerts** (`/risks`) to inspect early warning cards for **Heat Wave Stress** and **Fungal Outbreak Risk**.

### Minute 4:00 - 5:00: AI Farmer Assistant & PDF Diagnostic Report
1. Navigate to **AI Farm Assistant** (`/assistant`).
2. Click the suggested Hinglish prompt: *"Meri tomato ki leaves pe brown spots aa rahe hain"*.
3. Show the instant response matching structured disease symptoms, recommended leaf pruning, and KVK contact recommendations without hallucinating chemical dosages.
4. Navigate to **Diagnostic Reports** (`/reports`) and click **"Generate PDF Report"**.
5. Click **"Download PDF"** to open the clean ReportLab generated field diagnostic report.
6. Conclude by demonstrating system robustness in **DEMO MODE** requiring zero GPU hardware or external API keys.
