import { useRef, useMemo, useEffect } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';

interface Voxel {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    semantic: string;
}

interface OccupancyViewerProps {
    voxels: Voxel[];
}

export function OccupancyViewer({ voxels }: OccupancyViewerProps) {
    const meshRef = useRef<InstancedMesh>(null);
    const tempObject = useMemo(() => new Object3D(), []);
    const tempColor = useMemo(() => new Color(), []);

    useEffect(() => {
        if (!meshRef.current) return;
        
        // Update instance count if changed (re-create mesh usually better if count varies wildly, 
        // but for now we assume max count or just update range)
        // Actually, InstancedMesh needs fixed count. We should recreate if count grows.
        // For simplicity in this demo, we'll just update and set count.
        
        const count = voxels.length;
        if (count === 0) return;

        // If we have more voxels than mesh capacity, we might need to recreate logic
        // But let's assume a reasonable max or dynamic key
        
        for (let i = 0; i < count; i++) {
            const v = voxels[i];
            tempObject.position.set(v.x, v.y, v.z);
            // Smaller scale for "tech" look, and gap between voxels
            const scale = v.size * 0.9; 
            tempObject.scale.set(scale, scale, scale); 
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
            
            tempColor.set(v.color);
            meshRef.current.setColorAt(i, tempColor);
        }
        
        meshRef.current.count = count;
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [voxels, tempObject, tempColor]);

    // Use a key to force re-mount if count changes drastically to avoid buffer issues, 
    // or just allocate large buffer.
    // Let's allocate for 20000 voxels max for demo
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 50000]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                transparent 
                opacity={0.8} 
                roughness={0.2} 
                metalness={0.8} 
            />
        </instancedMesh>
    );
}
