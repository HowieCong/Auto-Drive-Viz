// Common Types
export interface BoundingBox2D {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
}

export interface BoundingBox3D {
  x: number;
  y: number;
  z: number;
  w: number; // width (y-axis)
  l: number; // length (x-axis)
  h: number; // height (z-axis)
  yaw: number;
  label: string;
  id: number;
}

export interface EgoState {
    speed: number;
    heading: number;
    acceleration: number; // m/s^2
    yawRate: number;     // rad/s
    timestamp: number;
}

export interface Voxel {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    semantic: string;
}
