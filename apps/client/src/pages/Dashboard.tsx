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
import { 
    AppShell, 
    Group, 
    Title, 
    Button, 
    Slider, 
    Text, 
    Badge, 
    ActionIcon, 
    Divider,
    Paper,
    Stack,
    Box
} from '@mantine/core';
import { IconCar, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'perspective' | 'bev' | 'tpv'>('perspective');
  const [perceptionMode, setPerceptionMode] = useState<'lidar' | 'occupancy'>('occupancy'); 
  
  const [fileList, setFileList] = useState<string[]>(['2011_09_26_drive_0001_sync']);
  const [selectedFile, setSelectedFile] = useState<string>('2011_09_26_drive_0001_sync');
  
  // State
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Data
  const [objects3D, setObjects3D] = useState<BoundingBox3D[]>([]);
  const [egoState, setEgoState] = useState<EgoState | null>(null);
  const [sceneMetadata, setSceneMetadata] = useState<any[]>([]); // Cache all frames
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
      
      // Clear previous data
      setSceneMetadata([]);
      
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/drive/metadata?file=${selectedFile}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setSceneMetadata(data);
            }
        })
        .catch(console.error);
  }, [selectedFile]);

  // Sync State from Metadata (No more polling for scene data)
  useEffect(() => {
      if (sceneMetadata.length > 0 && sceneMetadata[currentFrame]) {
          const frameData = sceneMetadata[currentFrame];
          setObjects3D(frameData.objects);
          setEgoState(frameData.ego);
      } else if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        pointsService.getSceneObjects(currentFrame).then((data: { ego: EgoState, objects: BoundingBox3D[] }) => {
            setEgoState(data.ego);
            setObjects3D(data.objects);
        });
      } else {
          // Fallback if metadata not loaded yet (optional, or show loading)
          // We can skip individual fetch if we assume metadata loads fast enough
      }
  }, [currentFrame, sceneMetadata]);

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
    'Switch View': {
        options: { 'Perspective': 'perspective', 'BEV': 'bev', 'TPV (Tri-View)': 'tpv' },
        value: 'perspective',
        onChange: (v: 'perspective' | 'bev' | 'tpv') => setViewMode(v)
    },
    'Resources': {
        options: fileList,
        value: selectedFile,
        onChange: (v) => setSelectedFile(v)
    },
    'Perception Source': {
        options: { 'LiDAR (Point Cloud)': 'lidar' },
        value: 'lidar',
        onChange: (v: 'lidar' | 'occupancy') => setPerceptionMode(v)
    },
    // 'Search Scene': {
    //     value: '',
    //     onEditEnd: (query) => console.log('Searching for:', query) // Placeholder for future implementation
    // }
  }, [fileList]); // Re-render controls when fileList changes

  const url = `http://localhost:3000/points/sample?frame=${currentFrame}&file=${selectedFile}`;

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      styles={{
        main: { background: '#111', color: '#eee', height: '100vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <AppShell.Header p="xs" bg="#1a1a1a" withBorder>
        <Group justify="space-between" h="100%">
            
            {/* Logo & Title */}
            <Group gap="xs">
                <IconCar size={32} color="#00ffff" />
                <Title order={3} c="white" style={{ fontStyle: 'italic' }}>
                    <Text span c="cyan" inherit>Auto-Drive</Text>-Viz
                </Title>
            </Group>

            <Divider orientation="vertical" />

            {/* Playback Controls */}
            <Group gap="md" style={{ flex: 1 }}>
                <Button 
                    color={isPlaying ? 'red' : 'green'} 
                    onClick={() => setIsPlaying(!isPlaying)}
                    leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                </Button>

                <Group style={{ flex: 1 }} gap="xs">
                    <Text size="sm" c="dimmed" w={80}>Frame: {currentFrame}</Text>
                    <Slider 
                        value={currentFrame}
                        onChange={setCurrentFrame}
                        min={0}
                        max={19}
                        step={1}
                        style={{ flex: 1 }}
                        color="cyan"
                        label={null}
                    />
                </Group>
            </Group>

            <Divider orientation="vertical" />

            {/* Badges */}
            <Group gap="sm">
                <Badge variant="outline" color="gray" size="lg" radius="md" styles={{ root: { textTransform: 'none', borderColor: '#444', background: '#222' } }}>
                    <Group gap={6}>
                        <Text c="dimmed" size="xs">Mode:</Text>
                        <Text c="cyan" fw={700}>{viewMode.toUpperCase()}</Text>
                    </Group>
                </Badge>
                
                <Badge variant="outline" color="gray" size="lg" radius="md" styles={{ root: { textTransform: 'none', borderColor: '#444', background: '#222' } }}>
                    <Group gap={6}>
                        <Text c="dimmed" size="xs">Source:</Text>
                        <Text c={perceptionMode === 'occupancy' ? 'grape' : 'green'} fw={700}>
                            {perceptionMode === 'occupancy' ? 'VISION' : 'LIDAR'}
                        </Text>
                    </Group>
                </Badge>
            </Group>

        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 60px)' }}>
            
            {/* LEFT: 3D Visualization */}
            <div style={{ flex: 3, position: 'relative', borderRight: '1px solid #333' }}>
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
                        {objects3D.map(obj => (
                            <BoundingBox3DVisualizer 
                                key={obj.id} 
                                box={obj} 
                                color={obj.label === 'Car' ? '#00ff00' : obj.label === 'Pedestrian' ? '#ff0000' : '#ffff00'} 
                            />
                        ))}

                        <mesh position={[0, 0, 0.5]}>
                            <boxGeometry args={[2, 4.5, 1.5]} />
                            <meshStandardMaterial color="#888" transparent opacity={0.5} />
                        </mesh>

                        <OrbitControls makeDefault />
                    </Canvas>
                )}
            </div>

            {/* RIGHT: Analysis Sidebar */}
            <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', background: '#1a1a1a', borderLeft: '1px solid #333' }}>
                <Paper bg="dark.8" radius={0} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid #333' }}>
                        <Text size="xs" fw={700} c="dimmed">SURROUND CAMERAS (4/6)</Text>
                        <Group gap={4}>
                            <Box w={8} h={8} bg="green" style={{ borderRadius: '50%' }} />
                            <Text size="xs" c="green" fw={700}>LIVE</Text>
                        </Group>
                    </Group>
                    
                    <div style={{ flex: 1 }}>
                        <CameraWall 
                            frame={currentFrame} 
                            file={selectedFile} 
                            onTimeUpdate={(_, f) => setCurrentFrame(f)} 
                        />
                    </div>
                </Paper>
            </div>

        </div>
      </AppShell.Main>
    </AppShell>
  );
}
