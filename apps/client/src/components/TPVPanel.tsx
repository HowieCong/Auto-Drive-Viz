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
  // Common style for each view
  const viewStyle = {
    flex: 1,
    background: '#000',
    border: '1px solid #333',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const labelStyle = {
    position: 'absolute' as const,
    top: 5,
    left: 5,
    color: '#00ffff',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 10,
    background: 'rgba(0,0,0,0.5)',
    padding: '2px 4px'
  };

  // Zoom level for orthographic cameras
  const zoomXY = 8;
  const zoomSide = 12; // Side/Front views usually need more zoom as Z range is small

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      
      {/* Top Row: XY (BEV) - Top View */}
      <div style={viewStyle}>
        <div style={labelStyle}>TPV-XY (Top View)</div>
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
      <div style={{ flex: 1, display: 'flex', gap: '2px' }}>
        
        {/* XZ Plane - Side View (Looking from -Y) 
            KITTI: X forward, Z up.
            We want X horizontal, Z vertical.
            Camera at (0, -50, 0), looking at (0,0,0).
            Up vector should be (0,0,1) so Z maps to Screen Y.
        */}
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-XZ (Side View)</div>
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
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-YZ (Front View)</div>
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
