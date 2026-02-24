import { useEffect, useMemo, useState, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import { extend } from '@react-three/fiber';

// Extend PointsMaterial to include custom properties if needed (not strictly necessary here)
extend({ PointsMaterial });

interface PointCloudViewerProps {
  size?: number;
  url?: string;
}

export function PointCloudViewer({ size = 0.1, url }: PointCloudViewerProps) {
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const [colors, setColors] = useState<Float32Array | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Worker
    workerRef.current = new Worker(new URL('../utils/pointCloudWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e) => {
        const { positions: posBuffer, colors: colBuffer } = e.data;
        setPositions(new Float32Array(posBuffer));
        setColors(new Float32Array(colBuffer));
    };

    return () => {
        workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!url || !workerRef.current) return;
    workerRef.current.postMessage({ url });
  }, [url]);

  const geometry = useMemo(() => {
    if (!positions || !colors) return null;
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geom.computeBoundingSphere(); 
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
