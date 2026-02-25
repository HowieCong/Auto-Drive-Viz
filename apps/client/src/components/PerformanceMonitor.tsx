import { addEffect } from '@react-three/fiber';
import { useEffect, useState } from 'react';

export function usePerformanceHistory() {
    const [history, setHistory] = useState<{ fps: number[], frameTime: number[] }>({ fps: [], frameTime: [] });
    const [current, setCurrent] = useState({ fps: 60, frameTime: 0 });

    useEffect(() => {
        let begin = performance.now();
        let prev = begin;
        let frames = 0;
        const maxPoints = 30; // Number of points in sparkline

        const unsub = addEffect(() => {
            frames++;
            const time = performance.now();
            
            // MS
            const frameTime = time - begin;
            begin = time;

            // FPS Update (every 200ms for smoother graph)
            if (time >= prev + 200) {
                const fps = Math.round((frames * 1000) / (time - prev));
                prev = time;
                frames = 0;
                
                setCurrent({ fps, frameTime: Number(frameTime.toFixed(1)) });

                setHistory(prevHist => {
                    const newFps = [...prevHist.fps, fps].slice(-maxPoints);
                    const newFrameTime = [...prevHist.frameTime, frameTime].slice(-maxPoints);
                    return { fps: newFps, frameTime: newFrameTime };
                });
            }
        });

        return unsub;
    }, []);

    return { ...current, history };
}