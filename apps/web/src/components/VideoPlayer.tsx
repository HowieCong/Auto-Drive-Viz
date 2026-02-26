'use client';

import { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface BoundingBox {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    confidence: number;
}

interface VideoPlayerProps {
    src: string;
    frame: number;
    onTimeUpdate: (time: number, frame: number) => void;
    boxes?: BoundingBox[];
    mode?: 'video' | 'image-sequence';
}

export function VideoPlayer({ src, frame, onTimeUpdate, boxes = [], mode = 'image-sequence' }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    // const canvasRef = useRef<HTMLCanvasElement>(null); // Removed Canvas
    const [dimensions, setDimensions] = useState({ width: 1242, height: 375 }); // Default to KITTI resolution

    // Sync video time with frame prop
    useEffect(() => {
        if (mode === 'video' && videoRef.current && Math.abs(videoRef.current.currentTime - frame * 0.1) > 0.2) {
            videoRef.current.currentTime = frame * 0.1;
        }
    }, [frame, mode]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth > 0 && (naturalWidth !== dimensions.width || naturalHeight !== dimensions.height)) {
            setDimensions({ width: naturalWidth, height: naturalHeight });
        }
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black', lineHeight: 0, fontSize: 0 }}>
            {mode === 'video' ? (
                <Box 
                    component="video"
                    ref={videoRef}
                    src={src}
                    sx={{ width: '100%', display: 'block' }}
                    controls={false}
                    muted
                    onTimeUpdate={() => {
                        if (videoRef.current) {
                            // 10 FPS assumption
                            const frame = Math.floor(videoRef.current.currentTime * 10);
                            onTimeUpdate(videoRef.current.currentTime, frame);
                        }
                    }}
                />
            ) : (
                <Box 
                    component="img"
                    src={src}
                    alt="Sequence"
                    sx={{ width: '100%', display: 'block' }}
                    onLoad={handleImageLoad}
                />
            )}
            
            {/* SVG Overlay for Boxes */}
            <Box 
                component="svg"
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none' 
                }}
            >
                {boxes.map((box, idx) => {
                    const textWidth = box.label.length * 8 + 10;
                    return (
                        <g key={`${box.label}-${idx}-${box.x}`}>
                            {/* Box */}
                            <rect
                                x={box.x}
                                y={box.y}
                                width={box.w}
                                height={box.h}
                                fill="none"
                                stroke="#00ff00"
                                strokeWidth="3"
                            />
                            
                            {/* Label Background */}
                            <rect
                                x={box.x}
                                y={box.y - 20}
                                width={textWidth}
                                height={20}
                                fill="rgba(0, 255, 0, 0.4)"
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
            </Box>
        </Box>
    );
}
