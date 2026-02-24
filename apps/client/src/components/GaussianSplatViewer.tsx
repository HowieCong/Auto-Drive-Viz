import { Splat } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

interface GaussianSplatViewerProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export function GaussianSplatViewer({ 
  url, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1] 
}: GaussianSplatViewerProps) {
  // Simple check if file exists (fetch head) before trying to load, 
  // to avoid crashing the whole scene if splat is missing.
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(url, { method: 'HEAD' })
      .then(res => {
        if (res.ok) setExists(true);
        else {
          console.warn(`Splat file not found at ${url}. Please train your model first.`);
          setExists(false);
        }
      })
      .catch(() => setExists(false));
  }, [url]);

  if (exists === false) {
    return null; // Or return a placeholder text in 3D space
  }

  if (exists === null) return null; // Loading check

  return (
    <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)} scale={new THREE.Vector3(...scale)}>
      {/* 
        Splat component from @react-three/drei handles loading and rendering .splat files.
        Note: .splat files are usually Y-up in 3DGS standard, while our scene is Z-up (KITTI).
        We might need additional rotation adjustments here or in parent.
      */}
      <Splat src={url} />
    </group>
  );
}
