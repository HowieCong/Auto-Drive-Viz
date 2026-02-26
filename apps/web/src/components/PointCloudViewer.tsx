'use client';

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
    // In Next.js, worker paths can be tricky.
    // If we use 'import.meta.url', it needs to be relative to this file.
    workerRef.current = new Worker(new URL('../lib/pointCloudWorker.ts', import.meta.url), { type: 'module' });
    
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
    
    // Request current frame
    workerRef.current.postMessage({ url, prefetch: false });

    // Prefetch next 5 frames
    // URL format: .../sample?frame=0&file=...
    // We need to parse URL to increment frame. 
    // This is a bit hacky inside the component, but keeps logic self-contained.
    try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const currentFrame = parseInt(params.get('frame') || '0');
        const file = params.get('file');
        
        if (file) {
            for (let i = 1; i <= 5; i++) {
                const nextFrame = (currentFrame + i) % 20; // Assuming 20 frames loop
                params.set('frame', nextFrame.toString());
                const nextUrl = `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
                workerRef.current.postMessage({ url: nextUrl, prefetch: true });
            }
        }
    } catch {
        // ignore url parsing errors
    }

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
