import { addEffect } from '@react-three/fiber';
import { useEffect, useState } from 'react';

export function usePerformanceMetrics() {
    const [metrics, setMetrics] = useState({ fps: 60, frameTime: 0 });

    useEffect(() => {
        let begin = performance.now();
        let prev = begin;
        let frames = 0;
        let fps = 60;

        const unsub = addEffect(() => {
            frames++;
            const time = performance.now();
            
            // MS (Frame time)
            const frameTime = time - begin;
            begin = time;

            // FPS (Update every 500ms to avoid jittering UI)
            if (time >= prev + 500) {
                fps = Math.round((frames * 1000) / (time - prev));
                prev = time;
                frames = 0;
                
                // Update State
                setMetrics({
                    fps,
                    frameTime: Number(frameTime.toFixed(1))
                });
            }
        });

        return unsub;
    }, []);

    return metrics;
}