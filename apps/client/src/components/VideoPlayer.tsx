import { useRef, useEffect, useState } from 'react';

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

export function VideoPlayer({ src, frame, onTimeUpdate, boxes = [], mode = 'video' }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1242, height: 375 }); // Default to KITTI approx

    // Sync video time with frame prop
    useEffect(() => {
        if (mode === 'video' && videoRef.current && Math.abs(videoRef.current.currentTime - frame * 0.1) > 0.2) {
            videoRef.current.currentTime = frame * 0.1;
        }
    }, [frame, mode]);

    // Handle Image Load for Dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setDimensions({ width: naturalWidth, height: naturalHeight });
    };

    // Draw boxes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw
        boxes.forEach(box => {
            // Scale if needed
            // If canvas matches image dimensions, scale is 1
            const scaleX = canvas.width / dimensions.width;
            const scaleY = canvas.height / dimensions.height;

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY);

            ctx.fillStyle = '#00ff00';
            ctx.font = '14px Arial';
            ctx.fillText(`${box.label} ${(box.confidence * 100).toFixed(0)}%`, box.x * scaleX, box.y * scaleY - 5);
        });
    }, [boxes, dimensions]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
            {mode === 'video' ? (
                <video 
                    ref={videoRef}
                    src={src}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                <img 
                    ref={imgRef}
                    src={`${src}${src.includes('?') ? '&' : '?'}frame=${frame}`}
                    alt="Sequence"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onLoad={handleImageLoad}
                />
            )}
            
            <canvas 
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', objectFit: 'contain' }}
            />
        </div>
    );
}
