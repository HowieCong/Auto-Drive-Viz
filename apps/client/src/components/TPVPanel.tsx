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
  const zoom = 8;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      
      {/* Top Row: XY (BEV) */}
      <div style={viewStyle}>
        <div style={labelStyle}>TPV-XY (Top)</div>
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={zoom} up={[0, 1, 0]} />
          <ambientLight intensity={0.5} />
          {/* Grid on XY plane */}
          <gridHelper args={[100, 10, 0x444444, 0x222222]} rotation={[Math.PI/2, 0, 0]} />
          
          <PointCloudViewer size={pointSize} url={url} />
          {objects.map(obj => (
             <BoundingBox3DVisualizer key={obj.id} box={obj} color="#00ff00" />
          ))}
        </Canvas>
      </div>

      {/* Bottom Row: XZ (Front) and YZ (Side) */}
      <div style={{ flex: 1, display: 'flex', gap: '2px' }}>
        
        {/* XZ Plane (Front View) */}
        {/* Looking from -Y direction? No, Front is usually looking along X or Y. 
            KITTI: X forward, Y left, Z up.
            Front View: Projection on YZ plane (looking from X)? Or Projection on XZ (looking from Y)?
            Usually "Front View" means looking at the front of the car.
            If X is forward, looking from front means looking from +X towards -X. Projection is YZ.
            BUT TPV usually defines planes: XY, XZ, YZ.
            TPV_xz: Projection onto XZ plane. This is "Side View" if Y is left-right.
            TPV_yz: Projection onto YZ plane. This is "Front View" if X is depth.
        */}
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-XZ (Side)</div>
            <Canvas>
                {/* Camera looking along Y axis (from -50 to 0) */}
                <OrthographicCamera makeDefault position={[0, -50, 0]} zoom={zoom} up={[0, 0, 1]} />
                <ambientLight intensity={0.5} />
                <gridHelper args={[100, 10, 0x444444, 0x222222]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ffff00" />
                ))}
            </Canvas>
        </div>

        {/* YZ Plane (Front) */}
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-YZ (Front)</div>
            <Canvas>
                {/* Camera looking along X axis (from 50 to 0) */}
                <OrthographicCamera makeDefault position={[50, 0, 0]} zoom={zoom} up={[0, 0, 1]} />
                <ambientLight intensity={0.5} />
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
