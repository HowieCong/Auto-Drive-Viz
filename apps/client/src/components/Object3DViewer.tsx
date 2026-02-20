import { Color } from 'three';
import type { BoundingBox3D } from '../models';

interface Object3DViewerProps {
  objects: BoundingBox3D[];
}

export function Object3DViewer({ objects }: Object3DViewerProps) {
  return (
    <group>
      {objects.map((obj) => (
        <SingleObject key={obj.id} obj={obj} />
      ))}
    </group>
  );
}

function SingleObject({ obj }: { obj: BoundingBox3D }) {
    // 3D Box: Center is x,y,z. Dimensions l,w,h.
    // In Three.js BoxGeometry args are width (x), height (y), depth (z). 
    // Wait, usually BoxGeometry(width, height, depth). 
    // Let's map: l->width(x), w->height(y)? No, in 3D Viz usually Z is up.
    // BoxGeometry defaults created at origin.
    // We need to rotate by yaw around Z axis.
    
    const color = new Color().setHSL(obj.id * 0.1, 1, 0.5);

    return (
        <group position={[obj.x, obj.y, obj.z + obj.h / 2]} rotation={[0, 0, obj.yaw]}>
            {/* Wireframe Box */}
            <mesh>
                <boxGeometry args={[obj.l, obj.w, obj.h]} />
                <meshBasicMaterial color={color} wireframe />
            </mesh>
            {/* Label */}
            {/* We could use Text from drei, but let's keep it simple or add it if requested. */}
            <mesh position={[0, 0, obj.h / 2 + 0.5]}>
                 {/* Simple marker for front/heading? */}
                 <boxGeometry args={[0.5, 0.5, 0.5]} />
                 <meshBasicMaterial color="yellow" />
            </mesh>
        </group>
    );
}
