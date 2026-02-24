import { useControls, monitor } from 'leva';
import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor() {
    const fpsRef = useRef(0);
    const msRef = useRef(0);
    const framesRef = useRef(0);
    const prevTimeRef = useRef(performance.now());
    const beginTimeRef = useRef(performance.now());

    useEffect(() => {
        const unsub = addEffect(() => {
            const time = performance.now();
            
            // MS (Frame time)
            msRef.current = time - beginTimeRef.current;
            beginTimeRef.current = time;

            // FPS Calculation
            framesRef.current++;
            if (time >= prevTimeRef.current + 1000) {
                fpsRef.current = Math.round((framesRef.current * 1000) / (time - prevTimeRef.current));
                prevTimeRef.current = time;
                framesRef.current = 0;
            }
        });

        return unsub;
    }, []);

    useControls('Performance', {
        FPS: monitor(() => fpsRef.current, { graph: true, interval: 100 }),
        'Frame (ms)': monitor(() => msRef.current, { graph: true, interval: 30 }),
    }, { collapsed: false });
}
