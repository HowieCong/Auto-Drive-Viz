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
  // Use a persistent buffer geometry to avoid re-allocation
  const geometryRef = useRef<BufferGeometry>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize buffers once (max 150k points for KITTI)
  const MAX_POINTS = 150000;
  
  const initialPositions = useMemo(() => new Float32Array(MAX_POINTS * 3), []);
  const initialColors = useMemo(() => new Float32Array(MAX_POINTS * 3), []);

  useEffect(() => {
    // Initialize Worker
    workerRef.current = new Worker(new URL('../utils/pointCloudWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e) => {
        const { positions: posBuffer, colors: colBuffer, count } = e.data;
        
        if (geometryRef.current) {
            const geom = geometryRef.current;
            const positions = new Float32Array(posBuffer);
            const colors = new Float32Array(colBuffer);

            // Update attributes
            // We assume the worker returns a buffer that fits into our pre-allocated one, 
            // OR we can just swap the buffer if we want (but swapping might cause GC).
            // Actually, for best performance in React Three Fiber, we can just update the array.
            
            // Optimization: If the worker transfers the buffer, we can just set it.
            // But BufferAttribute expects a typed array.
            
            geom.attributes.position.array.set(positions);
            geom.attributes.position.needsUpdate = true;
            
            geom.attributes.color.array.set(colors);
            geom.attributes.color.needsUpdate = true;
            
            geom.setDrawRange(0, count);
            geom.computeBoundingSphere();
        }
    };

    return () => {
        workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!url || !workerRef.current) return;
    workerRef.current.postMessage({ url });
  }, [url]);

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
            attach="attributes-position"
            count={MAX_POINTS}
            array={initialPositions}
            itemSize={3}
            usage={35048} // THREE.DynamicDrawUsage
            args={[initialPositions, 3]}
        />
        <bufferAttribute
            attach="attributes-color"
            count={MAX_POINTS}
            array={initialColors}
            itemSize={3}
            usage={35048} // THREE.DynamicDrawUsage
            args={[initialColors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        vertexColors 
        size={size} 
        sizeAttenuation={true} 
      />
    </points>
  );
}
