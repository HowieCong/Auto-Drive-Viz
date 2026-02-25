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
          <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={zoom} up={[0, 1, 0]} near={-100} far={100} />
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
        
        {/* XZ Plane (Side View - Looking from Y) */}
        {/* KITTI: X forward, Y left, Z up. */}
        {/* Looking from Y axis (Left side) towards vehicle */}
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-XZ (Side)</div>
            <Canvas>
                {/* Position on Y axis, looking at origin. Up is Z. */}
                <OrthographicCamera makeDefault position={[0, -50, 0]} zoom={zoom} up={[0, 0, 1]} near={-100} far={100} />
                <ambientLight intensity={0.5} />
                {/* Grid on XZ plane? No, GridHelper is usually XZ plane by default. We need to rotate it to match view? */}
                {/* Default GridHelper is on XZ plane (y=0). */}
                <gridHelper args={[100, 10, 0x444444, 0x222222]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ffff00" />
                ))}
            </Canvas>
        </div>

        {/* YZ Plane (Front View - Looking from X) */}
        {/* Looking from X axis (Front) towards vehicle */}
        <div style={viewStyle}>
            <div style={labelStyle}>TPV-YZ (Front)</div>
            <Canvas>
                {/* Position on X axis, looking at origin. Up is Z. */}
                <OrthographicCamera makeDefault position={[50, 0, 0]} zoom={zoom} up={[0, 0, 1]} near={-100} far={100} />
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
