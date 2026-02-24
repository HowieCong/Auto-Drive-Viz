# Backend Architecture

## Overview
The backend is a **NestJS** application that serves autonomous driving data (KITTI dataset) via REST APIs. It handles file reading, data parsing, and coordinate transformations.

## Key Technologies
- **NestJS**: Server Framework
- **TypeScript**: Language
- **Express**: Underlying HTTP Server

## Project Structure
- `src/modules`: Feature modules (e.g., `points`)
- `src/common`: Shared types and utilities
- `src/main.ts`: Application entry point

## Core Features
- **Data Serving**: Serves point cloud (.bin), images (.png), and Oxts (.txt) data.
- **Coordinate Transformation**: Transforms 3D bounding boxes from Velodyne coordinates to Camera coordinates for projection.
- **Tracklet Parsing**: Parses KITTI tracklet XML files to extract object labels and 3D bounding boxes.

## API Endpoints
- `GET /points/scene`: Returns ego vehicle state and 3D objects for a given frame.
- `GET /points/sample`: Returns raw point cloud data (binary).
- `GET /points/image`: Returns camera image data.
