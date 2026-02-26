'use client';

import { useState, useEffect } from 'react';
import type { BoundingBox2D } from '@/lib/types';
import { 
    Box, 
    Typography, 
    IconButton, 
    Modal, 
    Paper, 
    Slider, 
    Button, 
    Select, 
    MenuItem,
    Stack
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';

interface VideoContainerProps {
  label: string;
  src: string;
  frame: number;
  totalFrames?: number;
  onTimeUpdate?: (t: number, f: number) => void;
  onDownload?: () => void;
  children: React.ReactNode;
  boxes?: BoundingBox2D[]; // Add boxes prop
}

export function VideoContainer({ 
  label, 
  src, 
  frame, 
  totalFrames = 20,
  onTimeUpdate, 
  onDownload,
  children,
  boxes = [] 
}: VideoContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [modalFrame, setModalFrame] = useState(frame);
  
  // Update modal frame when prop frame changes (if not playing in modal independently)
  useEffect(() => {
    if (!isModalOpen && frame !== modalFrame) {
      setModalFrame(frame);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, isModalOpen]);

  // Modal Animation Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isModalOpen && isPlaying) {
      interval = setInterval(() => {
        setModalFrame(f => {
          const next = (f + 1) % totalFrames;
          // Sync back to parent if provided
          if (onTimeUpdate) onTimeUpdate(next * 0.1, next);
          return next;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isModalOpen, isPlaying, playbackSpeed, totalFrames, onTimeUpdate]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download logic (download current image)
      const link = document.createElement('a');
      link.href = src; // This might need adjustment if src is dynamic
      link.download = `${label.replace(/\s+/g, '_')}_${modalFrame}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Paper 
        elevation={0}
        sx={{ 
            position: 'relative', 
            border: 1, 
            borderColor: 'divider', 
            flexShrink: 0, 
            bgcolor: 'black', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 0
        }}
    >
      {/* Top Bar - Now outside video, above it */}
      <Box sx={{
        width: '100%',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        px: 1,
        py: 0.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{label}</Typography>
        <IconButton 
          size="small"
          onClick={() => setIsModalOpen(true)}
          color="primary"
          title="Open Player"
        >
          <OpenInFullIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Video Content (Preview) */}
      {children}

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setIsPlaying(false); }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
          <Paper sx={{
            width: '80%',
            maxWidth: '1000px',
            bgcolor: '#1a1a1a',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 24
          }}>
            {/* Modal Header */}
            <Box sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.paper'
            }}>
              <Typography variant="h6" color="text.primary">{label} - Player</Typography>
              <IconButton 
                onClick={() => { setIsModalOpen(false); setIsPlaying(false); }}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal Content */}
            <Box sx={{ p: 2, bgcolor: 'black', display: 'flex', justifyContent: 'center', position: 'relative' }}>
               <Box sx={{ width: '100%', maxHeight: '60vh', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                 <Box 
                    component="img"
                    src={src.replace(/frame=\d+/, `frame=${modalFrame}`)}
                    sx={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                    alt="Full View"
                 />
                 
                 {/* Render 2D Boxes in Modal */}
                 <svg 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        pointerEvents: 'none' 
                    }}
                    viewBox="0 0 1242 375" // Assuming KITTI resolution, ideally should be dynamic or percentage based
                    preserveAspectRatio="xMidYMid meet"
                 >
                    {boxes.map((box, idx) => {
                         const textWidth = box.label.length * 8 + 10; // Approximate width
                         return (
                            <g key={idx}>
                                {/* Box */}
                                <rect
                                    x={box.x}
                                    y={box.y}
                                    width={box.w}
                                    height={box.h}
                                    fill="none"
                                    stroke="#00ff00"
                                    strokeWidth="2"
                                />
                                
                                {/* Label Background */}
                                <rect
                                    x={box.x}
                                    y={box.y - 20}
                                    width={textWidth}
                                    height={20}
                                    fill="rgba(0, 255, 0, 0.2)"
                                    stroke="#00ff00"
                                    strokeWidth="1"
                                />

                                {/* Label Text */}
                                <text
                                    x={box.x + 5}
                                    y={box.y - 5}
                                    fill="#ffffff"
                                    fontSize="12"
                                    fontWeight="bold"
                                    style={{ textShadow: '1px 1px 1px black' }}
                                >
                                    {box.label}
                                </text>
                            </g>
                         );
                     })}
                 </svg>
               </Box>
            </Box>

            {/* Modal Controls */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              
              {/* Progress Bar */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>{modalFrame}</Typography>
                <Slider 
                  min={0} 
                  max={totalFrames - 1} 
                  value={modalFrame}
                  onChange={(_, v) => setModalFrame(v as number)}
                  step={1}
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>{totalFrames}</Typography>
              </Stack>

              {/* Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button 
                    variant="contained"
                    color={isPlaying ? "error" : "success"}
                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </Button>

                  <Select 
                    value={playbackSpeed} 
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    size="small"
                    sx={{ minWidth: 80 }}
                  >
                    <MenuItem value={0.5}>0.5x</MenuItem>
                    <MenuItem value={1}>1.0x</MenuItem>
                    <MenuItem value={2}>2.0x</MenuItem>
                  </Select>
                </Stack>

                <Button 
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download Frame
                </Button>
              </Box>
            </Box>
          </Paper>
      </Modal>
    </Paper>
  );
}
