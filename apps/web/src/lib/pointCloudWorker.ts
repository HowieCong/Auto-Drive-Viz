// Cache to store processed buffers
const cache = new Map<string, { positions: ArrayBuffer, colors: ArrayBuffer }>();

// Worker for fetching and parsing point cloud data
self.onmessage = async (e) => {
    const { url, prefetch } = e.data;
    if (!url) return;

    // If result is cached, return immediately (unless it's a prefetch request, then we just ensure it's in cache)
    if (cache.has(url)) {
        if (!prefetch) {
            const cached = cache.get(url)!;
            // We must copy buffers because Transferable objects detach the original
            // Or we can just re-send? Actually, if we transfer, cache loses it.
            // So we cannot use Transferable if we want to cache in Worker RAM.
            // We have to copy.
            self.postMessage({ 
                positions: cached.positions.slice(0), 
                colors: cached.colors.slice(0),
                url 
            });
        }
        return;
    }

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

        // Cache the result (keep as ArrayBuffer)
        // We clone it for cache because we might transfer one copy
        // Actually, Float32Array.buffer returns the underlying buffer.
        // Let's store copies in cache.
        const posBuffer = posArray.buffer;
        const colBuffer = colArray.buffer;
        
        cache.set(url, { 
            positions: posBuffer.slice(0), 
            colors: colBuffer.slice(0) 
        });

        // If not prefetch, send back
        if (!prefetch) {
            const transferList = [posBuffer, colBuffer] as Transferable[];
            self.postMessage({ 
                positions: posBuffer, 
                colors: colBuffer,
                url
            }, { transfer: transferList });
        }

    } catch {
        // console.error(err);
    }
};
