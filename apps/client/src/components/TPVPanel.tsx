import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { PointCloudViewer } from './PointCloudViewer';
import { BoundingBox3DVisualizer } from './BoundingBox3DVisualizer';
import type { BoundingBox3D } from '../types';
import { Box, Typography, Paper } from '@mui/material';

interface TPVPanelProps {
  url?: string;
  objects?: BoundingBox3D[];
  pointSize?: number;
}

interface ViewContainerProps {
    label: string;
    children: React.ReactNode;
}

const ViewContainer = ({ label, children }: ViewContainerProps) => (
    <Paper sx={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden', 
        border: 1, 
        borderColor: 'divider', 
        bgcolor: 'black',
        borderRadius: 0 
    }}>
        <Typography 
          variant="caption" 
          sx={{ 
              position: 'absolute', 
              top: 5, 
              left: 5, 
              zIndex: 10, 
              bgcolor: 'rgba(0,0,0,0.6)', 
              px: 1, 
              borderRadius: 1,
              color: 'primary.main',
              fontWeight: 'bold'
          }}
        >
            {label}
        </Typography>
        {children}
    </Paper>
);

export function TPVPanel({ url, objects = [], pointSize = 0.1 }: TPVPanelProps) {
  // Zoom level for orthographic cameras
  const zoomXY = 8;
  const zoomSide = 12; // Side/Front views usually need more zoom as Z range is small

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'background.default' }}>
      
      {/* Top Row: XY (BEV) - Top View */}
      <ViewContainer label="TPV-XY (Top View)">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={zoomXY} near={-100} far={100} up={[0, 1, 0]} />
          <ambientLight intensity={0.5} />
          <gridHelper args={[100, 10, 0x444444, 0x222222]} rotation={[Math.PI/2, 0, 0]} />
          
          <PointCloudViewer size={pointSize} url={url} />
          {objects.map(obj => (
             <BoundingBox3DVisualizer key={obj.id} box={obj} color="#00ff00" />
          ))}
        </Canvas>
      </ViewContainer>

      {/* Bottom Row: XZ (Side) and YZ (Front) */}
      <Box sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
        
        {/* XZ Plane - Side View */}
        <ViewContainer label="TPV-XZ (Side View)">
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
                <gridHelper args={[100, 10, 0x444444, 0x222222]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ffff00" />
                ))}
            </Canvas>
        </ViewContainer>

        {/* YZ Plane - Front View */}
        <ViewContainer label="TPV-YZ (Front View)">
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
                <gridHelper args={[100, 10, 0x444444, 0x222222]} rotation={[0, 0, Math.PI/2]} />
                
                <PointCloudViewer size={pointSize} url={url} />
                {objects.map(obj => (
                    <BoundingBox3DVisualizer key={obj.id} box={obj} color="#ff0000" />
                ))}
            </Canvas>
        </ViewContainer>
      </Box>
    </Box>
  );
}
