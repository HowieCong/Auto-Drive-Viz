import type { EgoState } from '../models';

interface CockpitPanelProps {
    ego: EgoState | null;
}

export function CockpitPanel({ ego }: CockpitPanelProps) {
    if (!ego) return null;

    // Convert speed m/s to km/h
    const speedKmh = (ego.speed * 3.6).toFixed(1);
    const steeringDeg = (ego.steeringAngle * 180 / Math.PI).toFixed(1);

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
                <div style={{ fontSize: '24px', color: '#00ffff' }}>{speedKmh} <span style={{fontSize: '14px'}}>km/h</span></div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>STEERING</div>
                <div style={{ fontSize: '24px', color: Number(steeringDeg) > 0 ? '#ff00ff' : '#00ff00' }}>
                    {steeringDeg}°
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>GEAR</div>
                <div style={{ fontSize: '24px', color: 'white' }}>D</div>
            </div>
            
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>TIME</div>
                <div style={{ fontSize: '24px', color: '#aaa' }}>{(ego.timestamp / 1000).toFixed(1)}</div>
            </div>
        </div>
    );
}
