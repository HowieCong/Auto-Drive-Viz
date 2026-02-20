import { VideoPlayer } from './VideoPlayer';
import type { BoundingBox2D } from '../models';
import { useState, useEffect } from 'react';

interface CameraWallProps {
  frame: number;
  file: string;
  onTimeUpdate: (t: number, f: number) => void;
}

const CAMERAS = [
  { id: 'image_02', label: 'FRONT (Color Left)' },
  { id: 'image_03', label: 'FRONT (Color Right)' },
  { id: 'image_00', label: 'FRONT (Gray Left)' },
  { id: 'image_01', label: 'FRONT (Gray Right)' },
];

export function CameraWall({ frame, file, onTimeUpdate }: CameraWallProps) {
  const [boxesMap, setBoxesMap] = useState<Record<string, BoundingBox2D[]>>({});

  useEffect(() => {
    // Fetch boxes for all cameras
    CAMERAS.forEach((cam) => {
      fetch(
        `http://localhost:3000/points/boxes?frame=${frame}&camera=${cam.id}&file=${file}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setBoxesMap((prev) => ({ ...prev, [cam.id]: data }));
        })
        .catch(console.error);
    });
  }, [frame, file]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        height: '100%',
        gap: '2px',
        background: '#000',
      }}
    >
      {CAMERAS.map((cam) => (
        <div
          key={cam.id}
          style={{ position: 'relative', border: '1px solid #333' }}
        >
          <div
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              zIndex: 10,
              background: 'rgba(0,0,0,0.5)',
              padding: '2px 5px',
              fontSize: '10px',
            }}
          >
            {cam.label}
          </div>
          <VideoPlayer
            src={`http://localhost:3000/points/image?camera=${cam.id}`}
            frame={frame}
            onTimeUpdate={cam.id === 'image_02' ? onTimeUpdate : () => {}}
            mode="image-sequence"
            boxes={boxesMap[cam.id] || []}
          />
        </div>
      ))}
    </div>
  );
}
