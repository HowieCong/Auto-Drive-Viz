import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { PointCloudViewer } from '../components/PointCloudViewer';
import { CameraWall } from '../components/CameraWall';
import { CockpitPanel } from '../components/CockpitPanel';
import { usePerformanceMonitor } from '../components/PerformanceMonitor';
import { useControls, button } from 'leva';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { BoundingBox3DVisualizer } from '../components/BoundingBox3DVisualizer';
import { pointsService } from '../apis/PointsService';
import type { EgoState, BoundingBox3D } from '../types';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'perspective' | 'bev'>('perspective');
  const [perceptionMode, setPerceptionMode] = useState<'lidar' | 'occupancy'>('occupancy'); 
  
  const [fileList, setFileList] = useState<string[]>(['2011_09_26_drive_0001_sync']);
  const [selectedFile, setSelectedFile] = useState<string>('2011_09_26_drive_0001_sync');
  
  // State
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Data
  const [objects3D, setObjects3D] = useState<BoundingBox3D[]>([]);
  const [egoState, setEgoState] = useState<EgoState | null>(null);

  // Cache - using ref to avoid re-renders and modification issues
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const frameCache = useMemo(() => new Map<number, { ego: EgoState, objects: BoundingBox3D[] }>(), [selectedFile]);

  // Init
  useEffect(() => {
    // Clear cache when file changes
    frameCache.clear();
    
    // ... (Existing init code)
    if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        setTimeout(() => setFileList(['2011_09_26_drive_0001_sync']), 0);
        return;
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/list`)
      .then(res => res.json())
      .then(list => {
          if (Array.isArray(list) && list.length > 0) {
              setFileList(list);
          }
      })
      .catch(console.error);
  }, []);

  // Pre-fetch Data Logic
  const fetchFrameData = useCallback(async (frame: number) => {
    if (frameCache.has(frame)) return frameCache.get(frame);

    try {
        let data;
        if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
            data = await pointsService.getSceneObjects(frame);
        } else {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/scene?frame=${frame}&file=${selectedFile}`);
            data = await res.json();
        }
        
        // Cache and return
        if (data) {
             frameCache.set(frame, data);
        }
        return data;
    } catch (e) {
        console.error('Fetch error:', e);
        return null;
    }
  }, [selectedFile, frameCache]);

  // Buffer upcoming frames
  useEffect(() => {
    if (!isPlaying) return;
    
    const bufferSize = 5;
    const maxFrame = 19; // Should be dynamic based on drive
    
    for (let i = 1; i <= bufferSize; i++) {
        const nextFrame = (currentFrame + i) % (maxFrame + 1);
        if (!frameCache.has(nextFrame)) {
            fetchFrameData(nextFrame);
        }
    }
  }, [currentFrame, isPlaying, fetchFrameData, frameCache]);

  // Render Loop (Update State)
  useEffect(() => {
    let active = true;
    const data = frameCache.get(currentFrame);
    if (data) {
        setEgoState(data.ego);
        setObjects3D(data.objects);
        setIsBuffering(false);
    } else {
        // Fetch immediately if not in cache
        setIsBuffering(true);
        fetchFrameData(currentFrame).then(data => {
            if (active && data) {
                setEgoState(data.ego);
                setObjects3D(data.objects);
                setIsBuffering(false);
            }
        });
    }
    return () => { active = false; };
  }, [currentFrame, fetchFrameData, frameCache]);

  // Animation Loop (Timer)
  useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      const loop = () => {
          if (isPlaying) {
              setCurrentFrame(f => (f + 1) % 20); 
              timeoutId = setTimeout(loop, 100); // 10 FPS
          }
      };
      
      if (isPlaying) {
          loop();
      }
      return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  // Activate Performance Monitor in Leva
  usePerformanceMonitor();

  const { pointSize, backgroundColor } = useControls({
    pointSize: { value: 0.1, min: 0.01, max: 1.0, step: 0.01 },
    backgroundColor: '#0a0a0a',
    'Switch View': button(() => {
        setViewMode((v) => v === 'perspective' ? 'bev' : 'perspective');
    }),
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
            <h2 style={{ margin: 0, color: '#00ffff', fontStyle: 'italic' }}>AutoDrive<span style={{color:'white'}}>Viz</span></h2>
            
            <div style={{ height: '30px', borderLeft: '1px solid #444' }} />
            
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ background: isPlaying ? '#ff4444' : '#44ff44', border: 'none', borderRadius: '4px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Frame: {currentFrame}</span>
                {isBuffering && <span style={{ color: 'orange', fontSize: '12px' }}> (Buffering...)</span>}
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
