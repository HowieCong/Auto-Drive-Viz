// Worker for fetching and parsing point cloud data
self.onmessage = async (e) => {
    const { url } = e.data;
    if (!url) return;

    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        
        const numPoints = Math.floor(buffer.byteLength / 16);
        const view = new DataView(buffer);
        
        const posArray = new Float32Array(numPoints * 3);
        const colArray = new Float32Array(numPoints * 3);
        
        // We can't use THREE.Color in worker easily without polyfill, so implement simple HSL to RGB
        // Hue to RGB helper
        const hslToRgb = (h: number, s: number, l: number) => {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p: number, q: number, t: number) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [r, g, b];
        };

        for (let i = 0; i < numPoints; i++) {
            const offset = i * 16;
            const x = view.getFloat32(offset, true);
            const y = view.getFloat32(offset + 4, true);
            const z = view.getFloat32(offset + 8, true);
            const intensity = view.getFloat32(offset + 12, true);
            
            const idx = i * 3;
            posArray[idx] = x;
            posArray[idx + 1] = y;
            posArray[idx + 2] = z;
            
            const hue = (1.0 - Math.min(Math.max(intensity, 0), 1)) * 0.666; // 0.666 approx 240/360
            const [r, g, b] = hslToRgb(hue, 1.0, 0.5);
            
            colArray[idx] = r;
            colArray[idx + 1] = g;
            colArray[idx + 2] = b;
        }

        // Transfer buffers to main thread to avoid copying
        self.postMessage({ 
            positions: posArray.buffer, 
            colors: colArray.buffer,
            count: numPoints
        }, [posArray.buffer, colArray.buffer]);

    } catch (err) {
        // console.error(err);
    }
};
