import { Box, AppBar, Toolbar, Typography, Button, Slider, Chip, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { PointCloudViewer } from '../components/PointCloudViewer';
import { CameraWall } from '../components/CameraWall';
import { CockpitPanel } from '../components/CockpitPanel';
import { TPVPanel } from '../components/TPVPanel';
import { usePerformanceMonitor } from '../components/PerformanceMonitor';
import { useControls } from 'leva';
import { useState, useEffect } from 'react';
import { BoundingBox3DVisualizer } from '../components/BoundingBox3DVisualizer';
import { pointsService } from '../apis/PointsService';
import type { EgoState, BoundingBox3D } from '../types';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'perspective' | 'bev' | 'tpv'>('perspective');
  
  const [fileList, setFileList] = useState<string[]>(['2011_09_26_drive_0001_sync']);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFile] = useState<string>('2011_09_26_drive_0001_sync');
  
  // State
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Data
  const [objects3D, setObjects3D] = useState<BoundingBox3D[]>([]);
  const [egoState, setEgoState] = useState<EgoState | null>(null);
  const [sceneMetadata, setSceneMetadata] = useState<{ objects: BoundingBox3D[], ego: EgoState }[]>([]); // Cache all frames
  // const [voxels, setVoxels] = useState<Voxel[]>([]);

  // Init
  useEffect(() => {
    // Check if running on Vercel (or static mode)
    // If static, we use hardcoded list since we can't scan directories
    if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        // Delay setting file list to avoid synchronous update in effect (though it's usually fine in mount effect)
        setTimeout(() => setFileList(['2011_09_26_drive_0001_sync']), 0);
        return;
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/list`)
      .then(res => res.json())
      .then(list => {
          if (Array.isArray(list) && list.length > 0) {
              setFileList(list);
              // setSelectedFile(list[0]); // Keep default or auto-select
          }
      })
      .catch(console.error);
  }, []);

  // Fetch Metadata Once when File Changes
  useEffect(() => {
      if (import.meta.env.VITE_USE_STATIC_DATA === 'true') return;
      
      const fetchData = async () => {
          try {
            // Clear previous data
            setSceneMetadata([]);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/drive/metadata?file=${selectedFile}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSceneMetadata(data);
            }
          } catch (error) {
              console.error(error);
          }
      };
      
      fetchData();
  }, [selectedFile]);



  // Animation Loop
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isPlaying) {
          interval = setInterval(() => {
              setCurrentFrame(f => (f + 1) % 20); 
          }, 100);
      }
      return () => clearInterval(interval);
  }, [isPlaying]);

  // Activate Performance Monitor in Leva
  usePerformanceMonitor();

  const { pointSize, backgroundColor } = useControls({
    pointSize: { value: 0.1, min: 0.01, max: 1.0, step: 0.01 },
    backgroundColor: '#0a0a0a',
    'View': {
        options: { 'Perspective': 'perspective', 'BEV': 'bev', 'TPV (Tri-View)': 'tpv' },
        value: 'perspective',
        onChange: (v: 'perspective' | 'bev' | 'tpv') => setViewMode(v)
    },
    // 'Resources': {
    //     options: fileList,
    //     value: selectedFile,
    //     onChange: (v: string) => setSelectedFile(v)
    // },
  }, [fileList]); // Re-render controls when fileList changes

  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/sample?frame=${currentFrame}&file=${selectedFile}`;
  // const sceneUrl = `http://localhost:3000/points/scene?frame=${currentFrame}&file=${selectedFile}`;

  // Sync State from Metadata (No more polling for scene data)
  useEffect(() => {
      const updateState = () => {
        if (sceneMetadata.length > 0 && sceneMetadata[currentFrame]) {
            const frameData = sceneMetadata[currentFrame];
            setObjects3D(frameData.objects);
            setEgoState(frameData.ego);
        } else if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
            pointsService.getSceneObjects(currentFrame).then((data: { ego: EgoState, objects: BoundingBox3D[] }) => {
                setEgoState(data.ego);
                setObjects3D(data.objects);
            });
        }
      };
      
      updateState();
  }, [currentFrame, sceneMetadata]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary' }}>
        
        {/* HEADER */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar sx={{ minHeight: '60px !important', gap: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCarIcon fontSize="large" />
                    Auto-Drive-Viz
                </Typography>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                
                <Button 
                    variant="contained" 
                    color={isPlaying ? "error" : "success"}
                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={() => setIsPlaying(!isPlaying)}
                    sx={{ fontWeight: 'bold' }}
                >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                </Button>

                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, mx: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: 80 }}>Frame: {currentFrame}</Typography>
                    <Slider 
                        min={0} max={19} 
                        value={currentFrame} 
                        onChange={(_, v) => setCurrentFrame(v as number)}
                        step={1}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                        label={`Data: ${selectedFile}`} 
                        variant="outlined" 
                        sx={{ 
                            borderColor: '#444', 
                            bgcolor: '#222',
                            '& .MuiChip-label': { color: 'text.secondary', fontWeight: 'bold' }
                        }} 
                    />

                    <Chip 
                        label={`View: ${viewMode.toUpperCase()}`} 
                        variant="outlined" 
                        sx={{ 
                            borderColor: '#444', 
                            bgcolor: '#222',
                            '& .MuiChip-label': { color: 'primary.main', fontWeight: 'bold' }
                        }} 
                    />
                </Box>
            </Toolbar>
        </AppBar>

        {/* MAIN LAYOUT */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* LEFT: 3D Visualization */}
            <Box sx={{ flex: 3, position: 'relative', borderRight: 1, borderColor: 'divider' }}>
                
                <CockpitPanel ego={egoState} />

                {viewMode === 'tpv' ? (
                    <TPVPanel url={url} objects={objects3D} pointSize={pointSize} />
                ) : (
                    <Canvas style={{ background: backgroundColor }}>
                        {viewMode === 'perspective' && <PerspectiveCamera makeDefault position={[0, -40, 20]} fov={50} up={[0, 0, 1]} />}
                        {viewMode === 'bev' && <OrthographicCamera makeDefault position={[0, 0, 60]} zoom={12} up={[0, 1, 0]} />}
                        
                        <ambientLight intensity={0.4} />
                        <pointLight position={[20, 20, 20]} intensity={0.8} />
                        
                        <gridHelper args={[200, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />
                        <axesHelper args={[2]} />
                        
                        {/* Always render PointCloud as base */}
                        <PointCloudViewer size={pointSize} url={url} />

                        {/* 3D Bounding Boxes */}
                        {objects3D.map(obj => {
                            return (
                                <BoundingBox3DVisualizer 
                                    key={obj.id} 
                                    box={obj} 
                                    color={obj.label === 'Car' ? '#00ff00' : obj.label === 'Pedestrian' ? '#ff0000' : '#ffff00'} 
                                />
                            );
                        })}

                        <mesh position={[0, 0, 0.5]}>
                            <boxGeometry args={[2, 4.5, 1.5]} />
                            <meshStandardMaterial color="#888" transparent opacity={0.5} />
                        </mesh>

                        <OrbitControls makeDefault />
                    </Canvas>
                )}
            </Box>

            {/* RIGHT: Analysis */}
            <Box sx={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', minHeight: 0 }}>
                <Box sx={{ flex: 1, bgcolor: '#000', borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Box sx={{ p: 1, fontSize: '12px', color: 'text.secondary', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">STEREO CAMERAS (Front)</Typography>
                        <Typography variant="caption" sx={{ color: 'success.main' }}>● LIVE</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <CameraWall 
                            frame={currentFrame} 
                            file={selectedFile} 
                            onTimeUpdate={(_, f) => setCurrentFrame(f)} 
                        />
                    </Box>
                </Box>
            </Box>

        </Box>
    </Box>
  );
}
