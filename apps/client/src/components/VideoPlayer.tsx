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

export function VideoPlayer({ src, frame, onTimeUpdate, boxes = [], mode = 'image-sequence' }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); 

    // Sync video time with frame prop
    useEffect(() => {
        if (mode === 'video' && videoRef.current && Math.abs(videoRef.current.currentTime - frame * 0.1) > 0.2) {
            videoRef.current.currentTime = frame * 0.1;
        }
    }, [frame, mode]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth !== dimensions.width || naturalHeight !== dimensions.height) {
            setDimensions({ width: naturalWidth, height: naturalHeight });
        }
    };

    // Draw boxes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || dimensions.width === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw
        boxes.forEach(box => {
            // Box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            // Label Background
            const text = `${box.label}`;
            ctx.font = 'bold 12px Arial';
            const textMetrics = ctx.measureText(text);
            const padding = 4;
            const textW = textMetrics.width + padding * 2;
            const textH = 16 + padding * 2;

            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Semi-transparent green bg
            ctx.fillRect(box.x, box.y - textH + 2, textW, textH);
            
            // Label Border
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.strokeRect(box.x, box.y - textH + 2, textW, textH);

            // Text
            ctx.fillStyle = '#ffffff'; // White text
            ctx.fillText(text, box.x + padding, box.y - 6);
        });
    }, [boxes, dimensions]);

    return (
        <div style={{ position: 'relative', width: '100%', background: '#000' }}>
            {mode === 'video' ? (
                <video 
                    ref={videoRef}
                    src={src}
                    style={{ width: '100%', display: 'block' }}
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
                    src={src}
                    alt="Sequence"
                    style={{ width: '100%', display: 'block' }}
                    onLoad={handleImageLoad}
                />
            )}
            
            {dimensions.width > 0 && (
                <canvas 
                    ref={canvasRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        pointerEvents: 'none' 
                    }}
                />
            )}
        </div>
    );
}
