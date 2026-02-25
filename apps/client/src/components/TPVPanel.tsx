import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { PointCloudViewer } from './PointCloudViewer';
import { BoundingBox3DVisualizer } from './BoundingBox3DVisualizer';
import type { BoundingBox3D } from '../types';

interface TPVPanelProps {
  url?: string;
  objects?: BoundingBox3D[];
  pointSize?: number;
}

export function TPVPanel({ url, objects = [], pointSize = 0.1 }: TPVPanelProps) {
  // Zoom level for orthographic cameras
  const zoomXY = 8;
  const zoomSide = 12; // Side/Front views usually need more zoom as Z range is small

  return (
    <div className="w-full h-full flex flex-col gap-0.5">
      
      {/* Top Row: XY (BEV) - Top View */}
      <div className="flex-1 bg-black border border-border relative overflow-hidden">
        <div className="absolute top-1 left-1 text-primary text-xs font-bold z-10 bg-black/50 px-1 py-0.5 rounded">TPV-XY (Top View)</div>
        <Canvas>
          {/* Looking down from +Z to origin. X is right, Y is up (in screen). 
              KITTI: X forward, Y left. 
              To match standard map: X should be UP, Y should be LEFT? 
              Let's stick to standard Three.js convention first: Y is up.
              If Camera at (0,0,50), looking at (0,0,0), Up (0,1,0).
              Then Screen X = World X, Screen Y = World Y.
          */}
          <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={zoomXY} near={-100} far={100} up={[0, 1, 0]} />
          <ambientLight intensity={0.5} />
          <gridHelper args={[100, 10, 0x444444, 0x222222]} rotation={[Math.PI/2, 0, 0]} />
          
          <PointCloudViewer size={pointSize} url={url} />
          {objects.map(obj => (
             <BoundingBox3DVisualizer key={obj.id} box={obj} color="#00ff00" />
          ))}
        </Canvas>
      </div>

      {/* Bottom Row: XZ (Side) and YZ (Front) */}
      <div className="flex-1 flex gap-0.5">
        
        {/* XZ Plane - Side View (Looking from -Y) 
            KITTI: X forward, Z up.
            We want X horizontal, Z vertical.
            Camera at (0, -50, 0), looking at (0,0,0).
            Up vector should be (0,0,1) so Z maps to Screen Y.
        */}
        <div className="flex-1 bg-black border border-border relative overflow-hidden">
            <div className="absolute top-1 left-1 text-primary text-xs font-bold z-10 bg-black/50 px-1 py-0.5 rounded">TPV-XZ (Side View)</div>
            <Canvas>
                <OrthographicCamera 
                    makeDefault 
                    position={[0, -50, 0]} 
                    zoom={zoomSide} 
                    near={-100} 
                    far={100} 
                    up={[0, 0, 1]} 
                    onUpdate={c => c.lookAt(0, 0, 0)}
                />
                <ambientLight intensity={0.5} />
                {/* Grid on XZ plane */}
                <gridHelper args={[100, 10, 0x444444, 0x222222]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ffff00" />
                ))}
            </Canvas>
        </div>

        {/* YZ Plane - Front View (Looking from -X or +X) 
            KITTI: Y left, Z up.
            We want Y horizontal, Z vertical.
            Camera at (50, 0, 0) looking at (0,0,0).
            Up vector (0,0,1).
        */}
        <div className="flex-1 bg-black border border-border relative overflow-hidden">
            <div className="absolute top-1 left-1 text-primary text-xs font-bold z-10 bg-black/50 px-1 py-0.5 rounded">TPV-YZ (Front View)</div>
            <Canvas>
                <OrthographicCamera 
                    makeDefault 
                    position={[50, 0, 0]} 
                    zoom={zoomSide} 
                    near={-100} 
                    far={100} 
                    up={[0, 0, 1]}
                    onUpdate={c => c.lookAt(0, 0, 0)}
                />
                <ambientLight intensity={0.5} />
                {/* Grid on YZ plane */}
                <gridHelper args={[100, 10, 0x444444, 0x222222]} rotation={[0, 0, Math.PI/2]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ff0000" />
                ))}
            </Canvas>
        </div>
      </div>
    </div>
  );
}
