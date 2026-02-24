# Dataset Details

## Overview
This project uses the **KITTI Vision Benchmark Suite** dataset, specifically the raw data recordings.

## Data Format
- **LiDAR**: Velodyne HDL-64E point clouds stored as binary files (`.bin`). Each point contains (x, y, z, reflectance).
- **Camera**: Rectified color images (`image_02`) stored as PNG files.
- **GPS/IMU**: OXTS data stored as text files (`.txt`), providing vehicle localization and dynamics.
- **Tracklets**: XML files (`tracklet_labels.xml`) containing ground truth 3D bounding boxes for objects.

## Coordinate Systems
- **Velodyne**: Right-handed system (x: forward, y: left, z: up).
- **Camera**: Right-handed system (x: right, y: down, z: forward).
- **IMU/GPS**: Right-handed system (x: forward, y: left, z: up).

## Transformations
To visualize 3D boxes on 2D images, we perform the following transformation:
1. **Velodyne to Camera**: `P_cam = Tr_velo_to_cam * P_velo`
2. **Camera to Image**: `P_img = P_rect_xx * P_cam` (Perspective Projection)
