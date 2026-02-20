import { useEffect, useMemo, useState } from 'react';
import { BufferGeometry, Float32BufferAttribute, Color, PointsMaterial } from 'three';
import { extend } from '@react-three/fiber';

// Extend PointsMaterial to include custom properties if needed (not strictly necessary here)
extend({ PointsMaterial });

interface PointCloudViewerProps {
  size?: number;
  url?: string;
}

export function PointCloudViewer({ size = 0.1, url = 'http://localhost:3000/points/sample' }: PointCloudViewerProps) {
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const [colors, setColors] = useState<Float32Array | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        // Parse binary data
        // Format: x, y, z, intensity (all float32)
        const view = new DataView(buffer);
        const numPoints = buffer.byteLength / 16; // 4 floats * 4 bytes
        
        const posArray = new Float32Array(numPoints * 3);
        const colArray = new Float32Array(numPoints * 3);
        
        for (let i = 0; i < numPoints; i++) {
          const offset = i * 16;
          const x = view.getFloat32(offset, true); // Little endian
          const y = view.getFloat32(offset + 4, true);
          const z = view.getFloat32(offset + 8, true);
          const intensity = view.getFloat32(offset + 12, true);
          
          // Position
          posArray[i * 3] = x;
          posArray[i * 3 + 1] = y;
          posArray[i * 3 + 2] = z;
          
          // Color based on intensity (0-1)
          // Let's use a heatmap: Low -> Blue, High -> Red
          // Simple: Intensity -> grayscale for now, or mix
          const color = new Color();
          // Map intensity 0..1 to HSL hue 240..0 (Blue to Red)
          // 0 -> 240 (Blue), 1 -> 0 (Red)
          const hue = (1.0 - Math.min(Math.max(intensity, 0), 1)) * 240 / 360;
          color.setHSL(hue, 1.0, 0.5);
          
          colArray[i * 3] = color.r;
          colArray[i * 3 + 1] = color.g;
          colArray[i * 3 + 2] = color.b;
        }
        
        setPositions(posArray);
        setColors(colArray);
      })
      .catch(console.error);
  }, [url]);

  const geometry = useMemo(() => {
    if (!positions || !colors) return null;
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geom.computeBoundingSphere(); // Optional, helps with frustum culling
    return geom;
  }, [positions, colors]);

  if (!geometry) return null;

  return (
    <points geometry={geometry}>
      <pointsMaterial 
        vertexColors 
        size={size} 
        sizeAttenuation={true} 
      />
    </points>
  );
}
