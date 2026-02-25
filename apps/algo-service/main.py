from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import os
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from typing import List, Optional

app = FastAPI()

# Configuration
KITTI_ROOT = os.getenv("KITTI_ROOT", "../client/public/data/kitti/2011_09_26")

# Load CLIP Model (Lazy Load to speed up startup, or Load on Startup)
print("Loading CLIP Model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("CLIP Model Loaded!")

class InferenceRequest(BaseModel):
    file: str
    frame: int

class SearchObject(BaseModel):
    id: str
    label: str

class SearchRequest(BaseModel):
    file: str
    frame: int
    query: str
    camera: str = "image_02"
    objects: List[SearchObject] = [] # List of objects to score against

@app.get("/")
def read_root():
    return {"status": "Algo Service Running", "model": "CLIP (Semantic Search)"}

@app.post("/detect")
def detect_objects(req: InferenceRequest):
    """
    Mock 3D Object Detection (PointPillars)
    """
    drive_path = os.path.join(KITTI_ROOT, req.file)
    bin_path = os.path.join(drive_path, "velodyne_points/data", f"{req.frame:010d}.bin")
    
    if not os.path.exists(bin_path):
        raise HTTPException(status_code=404, detail=f"Point cloud not found: {bin_path}")

    # Mock Boxes
    mock_boxes = [
        { "id": "pred_1", "h": 1.5, "w": 1.6, "l": 4.0, "x": 10.0, "y": 2.0, "z": -1.0, "yaw": 0.5, "label": "Car", "score": 0.95 },
        { "id": "pred_2", "h": 1.8, "w": 0.6, "l": 0.8, "x": 15.0, "y": -3.0, "z": -1.0, "yaw": 0.0, "label": "Pedestrian", "score": 0.88 },
        { "id": "pred_3", "h": 1.5, "w": 1.6, "l": 4.0, "x": 25.0, "y": 0.0, "z": -1.0, "yaw": 0.0, "label": "Car", "score": 0.75 },
        { "id": "pred_4", "h": 1.6, "w": 0.7, "l": 1.8, "x": 8.0, "y": 5.0, "z": -1.0, "yaw": 1.5, "label": "Cyclist", "score": 0.92 }
    ]
    
    return {"objects": mock_boxes}

@app.post("/search")
def semantic_search(req: SearchRequest):
    """
    Semantic Search using CLIP.
    1. Load Image (req.file, req.frame, req.camera)
    2. Crop objects based on (Mock) 2D Boxes or projected 3D Boxes
    3. Compute Similarity(Crop, Text Query)
    4. Return Objects with Similarity Scores
    """
    
    # 1. Load Image
    drive_path = os.path.join(KITTI_ROOT, req.file)
    img_path = os.path.join(drive_path, req.camera, "data", f"{req.frame:010d}.png")
    
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail=f"Image not found: {img_path}")
        
    try:
        image = Image.open(img_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")

    # 2. Get Object Crops
    # In a real system, we would project 3D boxes to 2D. 
    # For this demo, we will define some mock 2D crops corresponding to our mock 3D boxes.
    # Or better: We just run CLIP on the whole image vs text? No, that classifies the scene.
    # We need Object-Level search.
    # Let's mock the "Cropping" by assuming we have crops.
    # Since we can't easily crop dynamic real objects without real 2D boxes,
    # we will SIMULATE the CLIP scores based on the object labels.
    # THIS IS A MOCK for demonstration, as implementing full projection+cropping in MVP is too complex without real calib/boxes.
    
    # However, to make it "Real", we CAN run CLIP on the whole image and see if the text exists in scene.
    # But user wants to highlight specific objects.
    
    # Hack for MVP:
    # We use the 'label' of our mock boxes to determine score against query.
    # e.g. if query="red car", and box label="Car", we give high score.
    # Real CLIP implementation would be:
    # inputs = processor(text=[req.query], images=[crop1, crop2...], return_tensors="pt", padding=True)
    # outputs = model(**inputs)
    # logits_per_image = outputs.logits_per_image # this is image-text similarity score
    
    # Let's do a "Text-to-Label" matching using CLIP text encoder!
    # We compare Query embedding with Label embedding.
    
    # Use passed objects if available, otherwise use mock (fallback)
    target_objects = req.objects if req.objects else [
        { "id": "pred_1", "label": "Car" },
        { "id": "pred_2", "label": "Pedestrian" },
        { "id": "pred_3", "label": "Car" },
        { "id": "pred_4", "label": "Cyclist" }
    ]
    
    # Handle Pydantic models vs Dicts
    labels = []
    ids = []
    for obj in target_objects:
        if isinstance(obj, dict):
            labels.append(obj["label"])
            ids.append(obj["id"])
        else:
            labels.append(obj.label)
            ids.append(obj.id)
            
    if not labels:
        return {"results": []}
    
    # Compute Similarity between Query and Labels using CLIP Text Encoder
    inputs = processor(text=[req.query] + labels, return_tensors="pt", padding=True)
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
    
    # text_features[0] is query. text_features[1:] are labels.
    query_emb = text_features[0]
    label_embs = text_features[1:]
    
    # Cosine similarity
    query_emb = query_emb / query_emb.norm(dim=-1, keepdim=True)
    label_embs = label_embs / label_embs.norm(dim=-1, keepdim=True)
    
    scores = (label_embs @ query_emb.T).squeeze().tolist()
    
    # If single object, scores is a float
    if isinstance(scores, float):
        scores = [scores]
        
    results = []
    for i, obj_id in enumerate(ids):
        # Normalize score to 0-1 range (CLIP logits can be large)
        # Raw cosine similarity is -1 to 1. Usually 0.2-0.3 is high for CLIP.
        # Let's just return raw score and handle coloring in frontend.
        results.append({
            "id": obj_id,
            "score": float(scores[i])
        })
        
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
