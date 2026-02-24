# Frontend Architecture

## Overview
The frontend is built using **React**, **Three.js** (via **React Three Fiber**), and **Vite**. It provides a dashboard for visualizing autonomous driving data, including point clouds, camera feeds, and vehicle telemetry.

## Key Technologies
- **React 18**: UI Framework
- **Three.js / React Three Fiber**: 3D Visualization
- **Leva**: Control Panel
- **Vite**: Build Tool

## Project Structure
- `src/pages`: Main application pages (e.g., Dashboard)
- `src/components`: Reusable UI components (PointCloudViewer, CameraWall, etc.)
- `src/apis`: API integration layer
- `src/types`: TypeScript definitions
- `src/utils`: Helper functions and Web Workers

## Performance Optimization
- **Web Workers**: Point cloud parsing is offloaded to a worker thread to prevent UI blocking.
- **BufferGeometry**: Efficient rendering of large point clouds using typed arrays.
- **Request Cancellation**: AbortController is used to cancel stale API requests.
