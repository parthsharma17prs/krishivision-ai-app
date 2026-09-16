# Environment Configuration & Security Guide — KrishiVision AI

This guide documents the environment variable configuration, secret handling, and system modes for KrishiVision AI.

---

## 1. Quick Setup

Copy the sample environment file to `.env`:

```bash
cp .env.example .env
```

On Windows (Command Prompt / PowerShell):
```cmd
copy .env.example .env
```

---

## 2. Environment Variables Reference

| Variable | Type | Default | Description | Required |
|---|---|---|---|---|
| `PROJECT_NAME` | string | `"KrishiVision AI"` | Platform title used across OpenAPI & headers | Optional |
| `API_V1_STR` | string | `"/api"` | Base prefix for all REST API routes | Optional |
| `SECRET_KEY` | string | `"krishivision-ai-super-secret-key-..."` | JWT signing key. **Must be changed in production!** | Recommended |
| `DEMO_MODE` | boolean | `true` | When `true`, enables deterministic mock inferences, synthetic heatmaps, and offline fallback | Optional |
| `ENVIRONMENT` | string | `"development"` | `"development"` or `"production"` | Optional |
| `DATABASE_TYPE` | string | `"sqlite"` | Database provider: `"sqlite"`, `"postgres"`, or `"firebase"` | Optional |
| `DATABASE_URL` | string | `"sqlite:///./krishivision.db"` | SQLAlchemy database connection URI | Optional |
| `FIREBASE_CREDENTIALS_PATH` | string | `"./firebase-credentials.json"` | Path to Firebase service account JSON key | Optional |
| `FIREBASE_PROJECT_ID` | string | `None` | Firebase project ID | Optional |
| `FIREBASE_DATABASE_URL` | string | `None` | Firebase Realtime Database URL | Optional |
| `UPLOAD_DIR` | string | `"./uploads"` | Directory for diagnostic uploads and generated reports | Optional |
| `MAX_UPLOAD_SIZE_MB` | integer | `10` | Maximum file upload size in megabytes | Optional |
| `MODELS_DIR` | string | `"../models"` | Directory storing local ML weight files | Optional |
| `MODEL_MANIFEST_PATH` | string | `"../models/manifest.json"` | Manifest defining models, architectures & statuses | Optional |
| `WEATHER_PROVIDER` | string | `"demo"` | `"demo"` (offline deterministic) or `"openweather"` (live API) | Optional |
| `OPENWEATHER_API_KEY` | string | `""` | OpenWeatherMap API key (required if `WEATHER_PROVIDER="openweather"`) | Optional |
| `ASSISTANT_PROVIDER` | string | `"demo"` | `"demo"` (rule-based local KB), `"gemini"`, or `"openai"` | Optional |
| `LLM_API_KEY` | string | `""` | API key for Gemini or OpenAI (required if provider is not `"demo"`) | Optional |

---

## 3. Execution Modes

### Mode 1: Offline Demo Mode (Default)
- `DEMO_MODE=true`
- Runs 100% locally with zero external API dependencies or GPU requirements.
- Uses synthetic Grad-CAM heatmap generation, rule-based irrigation & risk models, and curated bilingual Agricultural Knowledge Base for conversational assistance.
- No paid API keys needed.

### Mode 2: Live Integration Mode
- `DEMO_MODE=false`
- `WEATHER_PROVIDER=openweather` + valid `OPENWEATHER_API_KEY`
- `ASSISTANT_PROVIDER=gemini` + valid `LLM_API_KEY`
- Loads PyTorch model weights (`models/disease_vit_yolo.pt`) when present.

---

## 4. Security Best Practices

> [!WARNING]
> - Never commit `.env` or `firebase-credentials.json` files to Git.
> - The root `.gitignore` is configured to prevent accidental staging of secrets.
> - In production, generate a secure random string for `SECRET_KEY`:
>   ```bash
>   python -c "import secrets; print(secrets.token_urlsafe(32))"
>   ```
