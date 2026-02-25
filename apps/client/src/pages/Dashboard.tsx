import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { PointCloudViewer } from '../components/PointCloudViewer';
import { CameraWall } from '../components/CameraWall';
import { CockpitPanel } from '../components/CockpitPanel';
import { usePerformanceMonitor } from '../components/PerformanceMonitor';
import { useControls } from 'leva';
import { useState, useEffect } from 'react';
import { BoundingBox3DVisualizer } from '../components/BoundingBox3DVisualizer';
import { pointsService } from '../apis/PointsService';
import type { EgoState, BoundingBox3D } from '../types';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'perspective' | 'bev' | 'tev'>('perspective');
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
        options: {
            'Perspective': 'perspective',
            'Bird\'s Eye View (BEV)': 'bev',
            'Trajectory Eye View (TEV)': 'tev'
        },
        value: 'perspective',
        onChange: (v: 'perspective' | 'bev' | 'tev') => setViewMode(v)
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

                <Canvas style={{ background: backgroundColor }}>
                    {viewMode === 'perspective' && <PerspectiveCamera makeDefault position={[0, -40, 20]} fov={50} up={[0, 0, 1]} />}
                    {viewMode === 'bev' && <OrthographicCamera makeDefault position={[0, 0, 60]} zoom={12} up={[0, 1, 0]} />}
                    {viewMode === 'tev' && (
                        <PerspectiveCamera 
                            makeDefault 
                            position={[-15, 0, 5]} 
                            rotation={[0, -Math.PI / 2, -0.2]} // Rotate to look forward (-X is forward in Three? No, wait.)
                            // KITTI: X forward, Y left, Z up.
                            // ThreeJS: Y up usually. But here we set up={[0,0,1]}.
                            // So X is forward?
                            // Let's verify: In PointCloudViewer, we render points directly.
                            // KITTI: x (front), y (left), z (up).
                            // Camera at [-15, 0, 5] means 15m behind, 5m up.
                            // LookAt [10, 0, 0].
                            // Manual rotation or use lookAt?
                            // PerspectiveCamera from drei supports manual props.
                            // Better to use a group or just manual rotation.
                            // Looking at +X from -X: Rotation around Z should be 0? 
                            // Standard ThreeJS camera looks down -Z.
                            // We need to rotate it to look down +X.
                            // Rotate Y by -90 deg (-PI/2) -> Looks down +X.
                            // Then tilt down a bit (Rotate Z?)
                            // Let's try LookAt equivalent with a dummy target or manual rotation.
                            // Rotation Order: ZYX?
                            // Euler(-PI/2, -PI/2, -PI/2)?
                            // Simpler: Use OrbitControls with fixed target for now or specific rotation.
                            // Let's try: position=[-15, 0, 5], rotation=[0, -Math.PI / 2, 0] (Look +X), then tilt down around local X?
                            // Actually, OrbitControls might override this. We need to disable OrbitControls in TEV or lock it.
                        />
                    )}
                    
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

                    {/* Controls: Disable or restrict based on mode */}
                    {viewMode === 'perspective' && <OrbitControls makeDefault />}
                    {viewMode === 'bev' && <OrbitControls makeDefault enableRotate={false} screenSpacePanning={true} />}
                    {viewMode === 'tev' && (
                        <OrbitControls 
                            makeDefault 
                            target={[10, 0, 0]} // Look at point 10m in front
                            enableRotate={true} 
                            enablePan={false}
                            maxPolarAngle={Math.PI / 2}
                        />
                    )}
                    {/* Stats removed */}
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
