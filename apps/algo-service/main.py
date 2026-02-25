from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import os
import struct

app = FastAPI()

# Configuration (Should match NestJS config)
KITTI_ROOT = os.getenv("KITTI_ROOT", "../client/public/data/kitti/2011_09_26")

class InferenceRequest(BaseModel):
    file: str
    frame: int

@app.get("/")
def read_root():
    return {"status": "Algo Service Running", "model": "PointPillars (Mock)"}

@app.post("/detect")
def detect_objects(req: InferenceRequest):
    """
    Simulate 3D Object Detection.
    In a real scenario, this would:
    1. Load point cloud from disk (req.file, req.frame)
    2. Preprocess (Voxelization)
    3. Run Inference (ONNX/PyTorch)
    4. Postprocess (NMS)
    5. Return Boxes
    """
    
    # Construct path to bin file
    drive_path = os.path.join(KITTI_ROOT, req.file)
    bin_path = os.path.join(drive_path, "velodyne_points/data", f"{req.frame:010d}.bin")
    
    if not os.path.exists(bin_path):
        raise HTTPException(status_code=404, detail=f"Point cloud not found: {bin_path}")

    # For MVP, we return dummy boxes or perturbed Ground Truth if we had access to labels.
    # Here we return a static mock box to prove connection.
    
    # Mock Box format: [h, w, l, x, y, z, yaw] (kitti format usually: h, w, l, x, y, z, rot_y)
    # Our frontend expects: { h, w, l, x, y, z, yaw, label, score }
    
    mock_boxes = [
        {
            "id": "pred_1",
            "h": 1.5, "w": 1.6, "l": 4.0,
            "x": 10.0, "y": 2.0, "z": -1.0,
            "yaw": 0.5,
            "label": "Car",
            "score": 0.95
        },
        {
            "id": "pred_2",
            "h": 1.8, "w": 0.6, "l": 0.8,
            "x": 15.0, "y": -3.0, "z": -1.0,
            "yaw": 0.0,
            "label": "Pedestrian",
            "score": 0.88
        }
    ]
    
    return {"objects": mock_boxes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
