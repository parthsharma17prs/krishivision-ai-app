# 🚀 Deploying KrishiVision AI on Railway

This guide provides step-by-step instructions to deploy **KrishiVision AI** (FastAPI Backend + React Frontend + PostgreSQL Database) on **[Railway](https://railway.app)**.

---

## 🗄️ Database Architecture for Production

KrishiVision AI uses **SQLAlchemy ORM**, which supports both:
- **PostgreSQL** (Production database on Railway)
- **SQLite** (Local development fallback)

All AI scan heatmaps, YOLOv11 leaf pathology diagnoses, NPK nutrient analysis, irrigation decisions, environmental risks, user accounts, and Google Sheet IoT sensor telemetry are stored directly in PostgreSQL.

---

## ⚡ Quick 1-Click Deployment Steps on Railway

### Step 1: Push Project to GitHub
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "Configure Railway deployment & PostgreSQL database"
git push origin main
```

---

### Step 2: Create a New Project on Railway
1. Go to **[Railway.app](https://railway.app)** and log in.
2. Click **+ New Project** > Select **Deploy from GitHub repo**.
3. Choose your **`KrishiVision-AI`** repository.

---

### Step 3: Add PostgreSQL Database Service
1. In your Railway Project Canvas, click **+ New** > **Database** > **PostgreSQL**.
2. Railway will automatically create a production PostgreSQL instance and set the `DATABASE_URL` environment variable.

---

### Step 4: Configure Environment Variables on Railway
In your web service on Railway, click **Variables** and add:

| Key | Recommended Value | Description |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Connects directly to Railway PostgreSQL |
| `DEMO_MODE` | `true` | Enables offline AI model fallback |
| `SECRET_KEY` | `your-production-super-secret-key-2026` | Secret key for JWT authentication |
| `ENVIRONMENT` | `production` | Production environment flag |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

---

### Step 5: Verification & End Results

Once deployed, Railway will generate a production URL for your application (e.g. `https://krishivision-ai-production.up.railway.app`).

- **Live Application UI**: `https://<your-app>.up.railway.app`
- **Interactive REST API Docs**: `https://<your-app>.up.railway.app/docs`
- **Google Sheet Live Sync Endpoint**: `https://<your-app>.up.railway.app/api/sensors/gsheets-sync`

All data and AI diagnostic results will automatically persist in Railway PostgreSQL!
