'use client';

import { VideoPlayer } from './VideoPlayer';
import { VideoContainer } from './VideoContainer';
import type { BoundingBox2D } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

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
    CAMERAS.forEach((cam) => {
      // Use relative API path for Next.js
      fetch(
        `/api/points/boxes?frame=${frame}&camera=${cam.id}&file=${file}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setBoxesMap((prev) => ({ ...prev, [cam.id]: data }));
        })
        .catch(console.error);
    });
  }, [frame, file]);

  const getImageUrl = (camId: string) => {
    return `/api/points/image?frame=${frame}&camera=${camId}&file=${file}`;
  };

  return (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflowY: 'auto', 
        gap: 0.5,
        bgcolor: 'black',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#111', 
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#444', 
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#666', 
        },
    }}>
      {CAMERAS.map((cam) => (
        <VideoContainer
          key={cam.id}
          label={cam.label}
          src={getImageUrl(cam.id)}
          frame={frame}
          onTimeUpdate={cam.id === 'image_02' ? onTimeUpdate : undefined}
          boxes={boxesMap[cam.id] || []}
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
    </Box>
  );
}
