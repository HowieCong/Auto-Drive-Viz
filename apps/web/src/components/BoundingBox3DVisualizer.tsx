'use client';

import type { BoundingBox3D } from '@/lib/types';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography } from '@mui/material';

interface BoundingBox3DVisualizerProps {
  box: BoundingBox3D & { score?: number }; // Optional score for search results
  color: string;
}

export function BoundingBox3DVisualizer({ box, color }: BoundingBox3DVisualizerProps) {
  const { x, y, z, l, w, h, yaw, label, score } = box;
  
  // Colorize based on search score if available
  // Score is usually 0.2-0.3 for CLIP matches. We can map it to opacity or color intensity.
  // Or if score > threshold, use highlight color.
  
  // Simple logic: If score exists, map 0.2-0.3 to Green->Red heat map? 
  // Or just mix original color with White based on score.
  
  // Let's use a simpler approach for MVP:
  // If score provided, use it to set opacity or color.
  // We assume color prop is the base category color.
  // If score is high (>0.25), we make it bright. If low, dim.
  
  const displayColor = score !== undefined 
    ? (score > 0.25 ? '#ff0000' : score > 0.2 ? '#ffff00' : '#444444') 
    : color;
    
  const opacity = score !== undefined 
    ? (score > 0.2 ? 0.8 : 0.2) 
    : 0.5;

  return (
    <group position={[x, y, z]} rotation={[0, 0, yaw]}>
      {/* Box Mesh */}
      <mesh>
        <boxGeometry args={[l, w, h]} />
        <meshStandardMaterial 
            color={displayColor} 
            transparent 
            opacity={opacity} 
            wireframe={false} 
        />
      </mesh>
      
      {/* Wireframe Outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(l, w, h)]} />
        <lineBasicMaterial color={displayColor} />
      </lineSegments>

      {/* Label & Score */}
      <Html position={[0, 0, h / 2 + 0.5]} center zIndexRange={[0, 50]}>
        <Box sx={{ 
            bgcolor: 'rgba(0,0,0,0.8)', 
            px: 0.6,
            py: 0.2,
            borderRadius: 1, 
            border: 1,
            borderColor: displayColor,
            userSelect: 'none'
        }}>
          <Typography variant="caption" sx={{ color: displayColor, fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
            {label} {score !== undefined && `(${(score * 100).toFixed(0)}%)`}
          </Typography>
        </Box>
      </Html>
    </group>
  );
}