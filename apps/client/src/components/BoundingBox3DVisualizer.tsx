import { useMemo } from 'react';
import type { BoundingBox3D } from '../types';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface BoundingBox3DProps {
  box: BoundingBox3D;
  color?: string;
}

export function BoundingBox3DVisualizer({ box, color = '#00ff00' }: BoundingBox3DProps) {
  // KITTI Tracklet:
  // x, y, z is CENTER of the box (we adjusted z in service)
  // l (length, x-axis), w (width, y-axis), h (height, z-axis)
  // yaw (rotation around z-axis)

  const corners = useMemo(() => {
    const { l, w, h } = box;
    const dx = l / 2;
    const dy = w / 2;
    const dz = h / 2;

    // 8 corners relative to center
    // Bottom: z = -dz, Top: z = +dz
    const points = [
      new THREE.Vector3(dx, dy, -dz),   // 0: front-left-bottom
      new THREE.Vector3(dx, -dy, -dz),  // 1: front-right-bottom
      new THREE.Vector3(-dx, -dy, -dz), // 2: back-right-bottom
      new THREE.Vector3(-dx, dy, -dz),  // 3: back-left-bottom
      new THREE.Vector3(dx, dy, dz),    // 4: front-left-top
      new THREE.Vector3(dx, -dy, dz),   // 5: front-right-top
      new THREE.Vector3(-dx, -dy, dz),  // 6: back-right-top
      new THREE.Vector3(-dx, dy, dz),   // 7: back-left-top
    ];

    // Edges (pairs of indices)
    // Bottom Loop: 0-1, 1-2, 2-3, 3-0
    // Top Loop: 4-5, 5-6, 6-7, 7-4
    // Pillars: 0-4, 1-5, 2-6, 3-7
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical
    ];
    
    // Front indicator (cross on front face)
    // Front face is usually +x in vehicle frame?
    // KITTI: +x is forward (length). So front face is at x=+dx.
    // Vertices at x=+dx are: 0, 1, 4, 5.
    // Cross: 0-5, 1-4.
    const frontEdges = [
        [0, 5], [1, 4]
    ];

    return { points, edges, frontEdges };
  }, [box]);

  // Apply rotation and position
  const { points, edges, frontEdges } = corners;
  
  return (
    <group position={[box.x, box.y, box.z]} rotation={[0, 0, box.yaw]}>
        {/* Main Box */}
        {edges.map((edge, i) => (
            <Line
                key={`edge-${i}`}
                points={[points[edge[0]], points[edge[1]]]}
                color={color}
                lineWidth={1}
            />
        ))}
        {/* Heading Indicator (Front Face Cross) */}
        {frontEdges.map((edge, i) => (
            <Line
                key={`front-${i}`}
                points={[points[edge[0]], points[edge[1]]]}
                color={color}
                lineWidth={1}
                opacity={0.5}
                transparent
            />
        ))}
        
        {/* Label */}
        {/* <Text 
            position={[0, 0, box.h/2 + 0.5]} 
            fontSize={0.5} 
            color="white"
            anchorX="center"
            anchorY="middle"
        >
            {box.label}
        </Text> */}
    </group>
  );
}
