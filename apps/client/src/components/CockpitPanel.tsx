import type { EgoState } from '../types';

interface CockpitPanelProps {
    ego: EgoState | null;
}

export function CockpitPanel({ ego }: CockpitPanelProps) {
    if (!ego) return null;

    // Convert speed m/s to km/h
    const speedKmh = (ego.speed * 3.6).toFixed(1);
    // const steeringDeg = (ego.steeringAngle * 180 / Math.PI).toFixed(1);
    const accel = (ego.acceleration || 0).toFixed(2);
    const yawRateDeg = ((ego.yawRate || 0) * 180 / Math.PI).toFixed(1);

    // Calculate cardinal direction
    const deg = (ego.heading * 180 / Math.PI + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIdx = Math.round(deg / 45) % 8;
    const direction = dirs[dirIdx];

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/80 border border-[#444] rounded-xl px-8 py-4 text-white flex gap-10 font-mono z-[100] backdrop-blur-[4px]">
            <div className="text-center">
                <div className="text-xs text-[#888]">SPEED</div>
                <div className="text-2xl text-[#00ffff] whitespace-nowrap">{speedKmh} <span className="text-sm">km/h</span></div>
            </div>
            
            <div className="text-center">
                <div className="text-xs text-[#888]">ACCEL</div>
                <div className={`text-2xl whitespace-nowrap ${Number(accel) > 0 ? 'text-[#ff00ff]' : 'text-[#00ff00'}`}>
                    {accel} <span className="text-sm">m/s²</span>
                </div>
            </div>

            <div className="text-center">
                <div className="text-xs text-[#888]">YAW RATE</div>
                <div className="text-2xl text-white whitespace-nowrap">{yawRateDeg} <span className="text-sm">°/s</span></div>
            </div>
            
             <div className="text-center">
                <div className="text-xs text-[#888]">HEADING</div>
                <div className="text-2xl text-[#aaa] whitespace-nowrap">{direction} <span className="text-sm">({deg.toFixed(0)}°)</span></div>
            </div>
        </div>
    );
}
