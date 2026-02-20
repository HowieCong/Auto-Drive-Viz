import { useControls, monitor } from 'leva';
import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor() {
    const fpsRef = useRef(60);
    const msRef = useRef(0);

    useEffect(() => {
        let begin = performance.now();
        let prev = begin;
        let frames = 0;

        const unsub = addEffect(() => {
            frames++;
            const time = performance.now();
            
            // MS (Frame time)
            msRef.current = time - begin;
            begin = time;

            // FPS (Average over 1s roughly)
            if (time >= prev + 1000) {
                fpsRef.current = Math.round((frames * 1000) / (time - prev));
                prev = time;
                frames = 0;
            }
        });

        return unsub;
    }, []);

    useControls('Performance', {
        FPS: monitor(() => fpsRef.current, { graph: true, interval: 100 }),
        'Frame (ms)': monitor(() => msRef.current, { graph: true, interval: 30 }),
    }, { collapsed: false });
}
