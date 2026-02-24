import { VideoPlayer } from './VideoPlayer';
import { VideoContainer } from './VideoContainer';
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

import { pointsService } from '../services/PointsService';

export function CameraWall({ frame, file, onTimeUpdate }: CameraWallProps) {
  const [boxesMap, setBoxesMap] = useState<Record<string, BoundingBox2D[]>>({});

  useEffect(() => {
    // Fetch boxes for all cameras
    if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        CAMERAS.forEach((cam) => {
            pointsService.get2DBoxes(frame, cam.id).then((data: BoundingBox2D[]) => {
                setBoxesMap((prev) => ({ ...prev, [cam.id]: data }));
            });
        });
        return;
    }

    CAMERAS.forEach((cam) => {
      fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/boxes?frame=${frame}&camera=${cam.id}&file=${file}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setBoxesMap((prev) => ({ ...prev, [cam.id]: data }));
        })
        .catch(console.error);
    });
  }, [frame, file]);

  const getImageUrl = (camId: string) => {
    if (import.meta.env.VITE_USE_STATIC_DATA === 'true') {
        return `/data/kitti/2011_09_26/${file}/${camId}/data/${frame.toString().padStart(10, '0')}.png`;
    }
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/points/image?camera=${camId}&frame=${frame}&file=${file}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        gap: '2px',
        background: '#000',
      }}
    >
      {CAMERAS.map((cam) => (
        <VideoContainer
          key={cam.id}
          label={cam.label}
          src={getImageUrl(cam.id)}
          frame={frame}
          onTimeUpdate={cam.id === 'image_02' ? onTimeUpdate : undefined}
        >
          <VideoPlayer
            src={getImageUrl(cam.id)}
            frame={frame}
            onTimeUpdate={cam.id === 'image_02' ? onTimeUpdate : () => {}}
            mode="image-sequence"
            boxes={boxesMap[cam.id] || []}
          />
        </VideoContainer>
      ))}
    </div>
  );
}
