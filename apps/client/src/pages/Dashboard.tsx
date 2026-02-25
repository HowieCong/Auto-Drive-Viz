import { Canvas } from '@react-three/fiber';
import { View, OrthographicCamera, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { PointCloudViewer } from '../components/PointCloudViewer';
import { CameraWall } from '../components/CameraWall';
import { CockpitPanel } from '../components/CockpitPanel';
import { usePerformanceMonitor } from '../components/PerformanceMonitor';
import { useControls, button } from 'leva';
import { useState, useEffect } from 'react';
import { BoundingBox3DVisualizer } from '../components/BoundingBox3DVisualizer';
import { pointsService } from '../apis/PointsService';
import type { EgoState, BoundingBox3D } from '../types';

// Helper component for scene content to avoid duplication
const SceneContent = ({ pointSize, url, objects3D, showGrid = true }: any) => (
    <>
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={0.8} />
        
        {showGrid && <gridHelper args={[200, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />}
        <axesHelper args={[2]} />
        
        <PointCloudViewer size={pointSize} url={url} />

        {objects3D.map((obj: any) => (
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
    </>
);

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
// ...
  // Poll Data
  useEffect(() => {
    // Throttling or debouncing could be added here if frame updates are too fast
    if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        pointsService.getSceneObjects(currentFrame).then((data: { ego: EgoState, objects: BoundingBox3D[] }) => {
            setEgoState(data.ego);
            setObjects3D(data.objects);
        });
        return;
    }

    // AbortController for cleaning up pending requests
    const controller = new AbortController();

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/scene?frame=${currentFrame}&file=${selectedFile}`, {
        signal: controller.signal
    })
        .then(res => res.json())
        .then(data => {
            setObjects3D(data.objects);
            setEgoState(data.ego);
        })
        .catch(err => {
            if (err.name !== 'AbortError') console.error(err);
        });

    return () => controller.abort();
  }, [currentFrame, perceptionMode, selectedFile]);

  // Animation Loop
  useEffect(() => {
      let interval: any;
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
        options: { 'Perspective': 'perspective', 'BEV (Top-Down)': 'bev', 'TPV (Tri-View)': 'tpv' },
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
    <div className="app-container" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#111', color: '#eee' }}>
        
        {/* HEADER */}
        <div style={{ height: '60px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px', background: '#1a1a1a' }}>
            <h2 style={{ margin: 0, color: '#00ffff', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🚗</span>
                <span>Auto-Drive-Viz</span>
            </h2>
            
            <div style={{ height: '30px', borderLeft: '1px solid #444' }} />
            
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ background: isPlaying ? '#ff4444' : '#44ff44', border: 'none', borderRadius: '4px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Frame: {currentFrame}</span>
                <input 
                    type="range" min={0} max={19} value={currentFrame} 
                    onChange={e => setCurrentFrame(parseInt(e.target.value))} 
                    style={{ flex: 1, accentColor: '#00ffff' }}
                />
            </div>
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* LEFT: 3D Visualization */}
            <div style={{ flex: 3, position: 'relative', borderRight: '1px solid #333' }}>
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #555' }}>
                        Mode: <span style={{ color: '#00ffff' }}>{viewMode.toUpperCase()}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #555' }}>
                        Source: <span style={{ color: perceptionMode === 'occupancy' ? '#ff00ff' : '#00ff00' }}>
                            {perceptionMode === 'occupancy' ? 'VISION (OVERLAY)' : 'LIDAR (RAW)'}
                        </span>
                    </div>
                </div>

                <CockpitPanel ego={egoState} />

                <Canvas style={{ background: backgroundColor }} eventSource={document.getElementById('root')!}>
                    {/* Perspective View (Default) */}
                    {viewMode === 'perspective' && (
                        <View index={1} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <PerspectiveCamera makeDefault position={[0, -40, 20]} fov={50} up={[0, 0, 1]} />
                            <OrbitControls makeDefault />
                            <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} />
                        </View>
                    )}

                    {/* BEV View */}
                    {viewMode === 'bev' && (
                        <View index={1} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <OrthographicCamera makeDefault position={[0, 0, 60]} zoom={12} up={[0, 1, 0]} />
                            <OrbitControls makeDefault enableRotate={false} />
                            <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} />
                        </View>
                    )}

                    {/* TPV View (Tri-Perspective View) */}
                    {viewMode === 'tpv' && (
                        <>
                            {/* Top View (XY Plane) - Top Left */}
                            <View index={1} style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', borderRight: '1px solid #333', borderBottom: '1px solid #333' }}>
                                <OrthographicCamera makeDefault position={[0, 0, 60]} zoom={10} up={[0, 1, 0]} />
                                <OrbitControls makeDefault enableRotate={false} />
                                <color attach="background" args={['#111']} />
                                <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} />
                                <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'cyan', fontSize: '12px', pointerEvents: 'none' }}>TOP (XY)</div>
                            </View>

                            {/* Front View (XZ Plane) - Bottom Left */}
                            <View index={2} style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', borderRight: '1px solid #333' }}>
                                <OrthographicCamera makeDefault position={[0, -60, 0]} zoom={10} up={[0, 0, 1]} />
                                <OrbitControls makeDefault enableRotate={false} />
                                <color attach="background" args={['#111']} />
                                <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} showGrid={false} />
                                <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'cyan', fontSize: '12px', pointerEvents: 'none' }}>FRONT (XZ)</div>
                            </View>

                            {/* Side View (YZ Plane) - Top Right */}
                            <View index={3} style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', borderBottom: '1px solid #333' }}>
                                <OrthographicCamera makeDefault position={[60, 0, 0]} zoom={10} up={[0, 0, 1]} />
                                <OrbitControls makeDefault enableRotate={false} />
                                <color attach="background" args={['#111']} />
                                <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} showGrid={false} />
                                <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'cyan', fontSize: '12px', pointerEvents: 'none' }}>SIDE (YZ)</div>
                            </View>

                            {/* Perspective (Free) - Bottom Right */}
                            <View index={4} style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%' }}>
                                <PerspectiveCamera makeDefault position={[20, -20, 20]} fov={50} up={[0, 0, 1]} />
                                <OrbitControls makeDefault />
                                <color attach="background" args={['#222']} />
                                <SceneContent pointSize={pointSize} url={url} objects3D={objects3D} />
                                <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'cyan', fontSize: '12px', pointerEvents: 'none' }}>FREE</div>
                            </View>
                        </>
                    )}
                </Canvas>
            </div>

            {/* RIGHT: Analysis */}
            <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
                <div style={{ flex: 1, background: '#000', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '5px 10px', fontSize: '12px', color: '#888', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                        <span>SURROUND CAMERAS (4/6)</span>
                        <span style={{ color: '#00ff00' }}>● LIVE</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <CameraWall 
                            frame={currentFrame} 
                            file={selectedFile} 
                            onTimeUpdate={(_, f) => setCurrentFrame(f)} 
                        />
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}
