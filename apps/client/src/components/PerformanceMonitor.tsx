import { useControls, monitor } from 'leva';
import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor() {
    const fpsRef = useRef(60);
    const msRef = useRef(0);

    // Controls for displaying numeric values
    const [stats, setStats] = useControls('Performance', () => ({
        'Current FPS': { value: 60, editable: false },
        'Current Frame (ms)': { value: 0, editable: false },
    }), { collapsed: false });

    useEffect(() => {
        let begin = performance.now();
        let prev = begin;
        let frames = 0;
        let lastUpdate = 0;

        const unsub = addEffect(() => {
            frames++;
            const time = performance.now();
            
            // MS (Frame time)
            msRef.current = time - begin;
            begin = time;

            // Update stats every 500ms to avoid UI flicker
            if (time - lastUpdate > 500) {
                // Calculate FPS
                const fps = Math.round((frames * 1000) / (time - prev));
                fpsRef.current = fps;
                
                // Update Leva values
                setStats({ 
                    'Current FPS': fps,
                    'Current Frame (ms)': Math.round(msRef.current * 100) / 100
                });
                
                prev = time;
                frames = 0;
                lastUpdate = time;
            }
        });

        return unsub;
    }, [setStats]);

    useControls('Performance', {
        FPS: monitor(() => fpsRef.current, { graph: true, interval: 100 }),
        'Frame (ms)': monitor(() => msRef.current, { graph: true, interval: 30 }),
    }, { collapsed: false });
}
