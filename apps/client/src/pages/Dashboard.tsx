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
    <div className="w-screen h-screen flex flex-col bg-background text-gray-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="h-16 border-b border-border flex items-center px-5 gap-5 bg-surface">
            <h2 className="m-0 text-primary italic flex items-center gap-2.5">
                <span className="text-2xl">🚗</span>
                <span className="font-bold tracking-wide">Auto-Drive-Viz</span>
            </h2>
            
            <div className="h-8 border-l border-gray-600" />
            
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`border-none rounded px-5 py-2 cursor-pointer font-bold transition-colors ${
                    isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-black'
                }`}
            >
                {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-mono text-gray-400">FRAME {currentFrame.toString().padStart(2, '0')}</span>
                <input 
                    type="range" min={0} max={19} value={currentFrame} 
                    onChange={e => setCurrentFrame(parseInt(e.target.value))} 
                    className="flex-1 accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="h-8 border-l border-gray-600" />

            <div className="flex gap-3 items-center">
                <div className="bg-gray-800 px-3 py-1 rounded border border-gray-700 text-xs flex items-center">
                    <span className="text-gray-400 mr-2 font-medium">MODE</span>
                    <span className="text-primary font-bold">{viewMode.toUpperCase()}</span>
                </div>
                <div className="bg-gray-800 px-3 py-1 rounded border border-gray-700 text-xs flex items-center">
                    <span className="text-gray-400 mr-2 font-medium">SOURCE</span>
                    <span className={`font-bold ${perceptionMode === 'occupancy' ? 'text-accent' : 'text-secondary'}`}>
                        {perceptionMode === 'occupancy' ? 'VISION' : 'LIDAR'}
                    </span>
                </div>
            </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: 3D Visualization */}
            <div className="flex-[3] relative border-r border-border">
                
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

            {/* RIGHT: Analysis */}
            <div className="flex-1 min-w-[400px] flex flex-col bg-surface border-l border-border">
                <div className="flex-1 bg-black border-b border-border flex flex-col">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-800 flex justify-between items-center font-bold tracking-wider">
                        <span>SURROUND CAMERAS (4/6)</span>
                        <span className="text-secondary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> LIVE</span>
                    </div>
                    <div className="flex-1 relative">
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
