# Auto-Drive-Viz Algorithm Service

This is a Python microservice responsible for running autonomous driving perception algorithms (e.g., 3D Object Detection). It exposes a REST API for the main visualization platform to request inference results.

## Features

- **Framework**: FastAPI
- **Model Support**: Designed for OpenPCDet / mmdetection3d (currently running Mock/Dummy inference for demonstration)
- **Input**: KITTI Point Cloud data (.bin files)
- **Output**: 3D Bounding Boxes (JSON)

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuration**:
   Ensure the `KITTI_ROOT` environment variable points to your dataset location, or update the default path in `main.py`.

## Usage

Start the server:

```bash
python main.py
```

The service will run on `http://0.0.0.0:8000`.

## API Endpoints

- `GET /`: Health check.
- `POST /detect`: Run 3D object detection on a specific frame.
  - **Body**: `{ "file": "drive_name", "frame": 0 }`
