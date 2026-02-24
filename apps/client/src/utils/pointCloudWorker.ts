// Worker for fetching and parsing point cloud data
self.onmessage = async (e) => {
    const { url, lodLevel = 1.0 } = e.data; // lodLevel: 1.0 (Full), 0.5 (Half), etc.
    if (!url) return;

    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        
        const numPointsTotal = Math.floor(buffer.byteLength / 16);
        const view = new DataView(buffer);
        
        // Dynamic Buffer Allocation
        // Estimate size based on LOD (approximate)
        // If LOD is distance-based, we don't know exact count yet.
        // We can do two passes or just over-allocate and slice.
        // Over-allocation is safer/faster than resize.
        
        // Max points = numPointsTotal
        // If we use stride, max points = numPointsTotal / stride
        
        // Strategy: 
        // 1. Always keep points < 20m (Crucial area)
        // 2. Sample remaining points based on distance and lodLevel
        
        const tempPos = new Float32Array(numPointsTotal * 3);
        const tempCol = new Float32Array(numPointsTotal * 3);
        let count = 0;

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

        for (let i = 0; i < numPointsTotal; i++) {
            const offset = i * 16;
            const x = view.getFloat32(offset, true);
            const y = view.getFloat32(offset + 4, true);
            const z = view.getFloat32(offset + 8, true);
            const intensity = view.getFloat32(offset + 12, true);
            
            // Distance Squared
            const d2 = x*x + y*y + z*z;
            
            // LOD Logic
            // < 20m (400 sq): Always Keep
            // < 50m (2500 sq): Keep 50% * lodLevel
            // > 50m: Keep 10% * lodLevel
            
            let keep = false;
            
            if (d2 < 400) { 
                keep = true; 
            } else if (d2 < 2500) {
                keep = Math.random() < (0.5 * lodLevel);
            } else {
                keep = Math.random() < (0.1 * lodLevel);
            }

            if (keep) {
                const idx = count * 3;
                tempPos[idx] = x;
                tempPos[idx + 1] = y;
                tempPos[idx + 2] = z;
                
                const hue = (1.0 - Math.min(Math.max(intensity, 0), 1)) * 0.666; 
                const [r, g, b] = hslToRgb(hue, 1.0, 0.5);
                
                tempCol[idx] = r;
                tempCol[idx + 1] = g;
                tempCol[idx + 2] = b;
                
                count++;
            }
        }

        // Slice to actual size
        const finalPos = tempPos.slice(0, count * 3);
        const finalCol = tempCol.slice(0, count * 3);

        // Transfer buffers to main thread
        const msg: any = { 
            positions: finalPos.buffer, 
            colors: finalCol.buffer 
        };
        self.postMessage(msg, [finalPos.buffer, finalCol.buffer]);

    } catch (err) {
        // console.error(err);
    }
};
