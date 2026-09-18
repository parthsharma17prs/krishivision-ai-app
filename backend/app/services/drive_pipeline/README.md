# 🌿 Google Drive Image Ingestion Pipeline for ML Models

A robust, modular, and decoupled Python pipeline that continuously ingests images from **Google Drive** and immediately feeds them into any **Machine Learning / AI model**.

---

## 🚀 Quick Start (3 Lines of Code)

```python
from drive_pipeline import DriveImagePipeline

# 1. Define your ML model inference function
def my_model_predict(image, metadata):
    # image is a PIL.Image instance
    # metadata contains {'id': '...', 'name': 'image.jpg', ...}
    print(f"Running inference on {metadata['name']} ({image.size})...")
    # return model.predict(image)

# 2. Initialize the pipeline
pipeline = DriveImagePipeline(model=my_model_predict)

# 3. Start continuous watcher (or call pipeline.poll_once())
pipeline.watch()
```

---

## 🧩 Architecture

```
┌────────────────────────────────┐
│   Google Drive Folder / Cloud  │  (e.g., "Agribotimage")
└───────────────┬────────────────┘
                │ OAuth2 Auto-Refresh & Query
                ▼
┌────────────────────────────────┐
│        DriveClient             │  Lists new files & streams image bytes
└───────────────┬────────────────┘
                │ Deduplication check (processed_history.json)
                ▼
┌────────────────────────────────┐
│     DriveImagePipeline         │  Orchestrator & Poller
└───────────────┬────────────────┘
                │ Dispatches (PIL Image, file metadata)
                ▼
┌────────────────────────────────┐
│      Your ML Model             │  (FastAPI / PyTorch / ONNX / PlantDoctor)
└───────────────┬────────────────┘
                ▼
      Prediction Results
```

---

## 🎯 Integrating with Your Existing Project ML Model

### Option A: Using the Built-In `PlantDoctorAdapter`
If your other project is KrishiVision AI (`projeect_suas` / `PlantDoctor`), you can hook it up with zero code:

```python
from drive_pipeline import DriveImagePipeline, PlantDoctorAdapter

# Automatically discovers and initializes PlantDoctor
adapter = PlantDoctorAdapter(project_path="/Users/macbook/Desktop/Projects/projeect_suas")
pipeline = DriveImagePipeline(model=adapter)

# Start watching Google Drive
pipeline.watch(poll_interval=5.0)
```

### Option B: Using Any Custom ML Model Class or Function

```python
from PIL import Image
from drive_pipeline import DriveImagePipeline, BaseModelAdapter

class MyCustomModel(BaseModelAdapter):
    def __init__(self):
        # Load your PyTorch, TensorFlow, or ONNX weights here
        pass

    def predict(self, image: Image.Image, metadata: dict):
        # Run your model's preprocessing and forward pass
        result = {"label": "Healthy", "confidence": 99.4}
        return result

pipeline = DriveImagePipeline(model=MyCustomModel())
pipeline.watch()
```

---

## ⚙️ Configuration Options

You can customize all behaviors via `DriveConfig`:

```python
from drive_pipeline import DriveConfig, DriveImagePipeline

config = DriveConfig(
    folder_name="Agribotimage",          # Google Drive folder name to watch
    folder_id=None,                      # Or specify exact Drive Folder ID
    credentials_file="credentials.json", # OAuth2 Client Secrets JSON
    token_file="token.json",             # Saved user token (auto-refreshed)
    poll_interval=5.0,                   # Check frequency in seconds
    history_file="processed.json",       # Deduplication history file
    save_local=True,                     # Save a local backup copy of images
    save_dir="downloads",                # Directory for local copies
)

pipeline = DriveImagePipeline(config=config, model=my_model)
pipeline.watch()
```

---

## 💻 Command-Line Interface (CLI)

You can run and test the pipeline directly from your terminal:

```bash
# 1. Test Google Drive credentials & connection
python3 -m drive_pipeline.cli --test-auth

# 2. Check for new images once
python3 -m drive_pipeline.cli --poll-once

# 3. Run continuous watcher with existing ML model
python3 -m drive_pipeline.cli --watch --use-model plantdoctor --poll-interval 5

# 4. Save local image copies as they arrive
python3 -m drive_pipeline.cli --watch --save-local --folder-name Agribotimage
```

---

## 🔑 Authentication Details
The pipeline automatically looks for:
1. `token.json` or `token.pickle` in the current working directory, `sample_dataset/raspberry_pi`, or `sample_dataset/Agribot`.
2. `credentials.json` for initial OAuth setup.
3. Automatically refreshes expired OAuth2 tokens using `google.auth.transport.requests.Request` and writes back the refreshed token so you never need to re-login.
