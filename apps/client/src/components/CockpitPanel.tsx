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
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '15px 30px',
            color: 'white',
            display: 'flex',
            gap: '40px',
            fontFamily: 'monospace',
            zIndex: 100,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>SPEED</div>
                <div style={{ fontSize: '24px', color: '#00ffff', whiteSpace: 'nowrap' }}>{speedKmh} <span style={{fontSize: '14px'}}>km/h</span></div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>ACCEL</div>
                <div style={{ fontSize: '24px', color: Number(accel) > 0 ? '#ff00ff' : '#00ff00', whiteSpace: 'nowrap' }}>
                    {accel} <span style={{fontSize: '14px'}}>m/s²</span>
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>YAW RATE</div>
                <div style={{ fontSize: '24px', color: 'white', whiteSpace: 'nowrap' }}>{yawRateDeg} <span style={{fontSize: '14px'}}>°/s</span></div>
            </div>
            
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>HEADING</div>
                <div style={{ fontSize: '24px', color: '#aaa', whiteSpace: 'nowrap' }}>{direction} <span style={{fontSize: '14px'}}>({deg.toFixed(0)}°)</span></div>
            </div>
        </div>
    );
}
