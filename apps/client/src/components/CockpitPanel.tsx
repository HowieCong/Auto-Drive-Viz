import type { EgoState } from '../types';
import { Box, Typography, Paper } from '@mui/material';
import { usePerformanceHistory } from './PerformanceMonitor';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

interface CockpitPanelProps {
    ego: EgoState | null;
}

interface StatItemProps {
    label: string;
    value: string;
    unit?: string;
    color?: string;
    history?: number[];
    min?: number;
    max?: number;
}

const StatItem = ({ label, value, unit, color = 'white', history, min, max }: StatItemProps) => (
    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{label}</Typography>
        
        {/* Value Display */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: history ? 0.5 : 0 }}>
            <Typography variant="h5" sx={{ color, fontFamily: 'monospace', fontWeight: 'bold' }}>
                {value}
            </Typography>
            {unit && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>{unit}</Typography>}
        </Box>

        {/* Sparkline Chart */}
        {history && history.length > 0 && (
            <Box sx={{ width: '100%', height: 20, opacity: 0.7 }}>
                <Sparklines data={history} min={min} max={max} width={80} height={20} margin={2}>
                    <SparklinesLine color={color === 'white' ? '#aaaaaa' : color} style={{ fill: "none", strokeWidth: 2 }} />
                    <SparklinesSpots size={2} style={{ fill: color === 'white' ? '#ffffff' : color }} />
                </Sparklines>
            </Box>
        )}
    </Box>
);

export function CockpitPanel({ ego }: CockpitPanelProps) {
    const { fps, frameTime, history } = usePerformanceHistory();

    if (!ego) return null;

    // Convert speed m/s to km/h
    const speedKmh = (ego.speed * 3.6).toFixed(1);
    const accel = (ego.acceleration || 0).toFixed(2);
    const yawRateDeg = ((ego.yawRate || 0) * 180 / Math.PI).toFixed(1);

    // Calculate cardinal direction
    const deg = (ego.heading * 180 / Math.PI + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIdx = Math.round(deg / 45) % 8;
    const direction = dirs[dirIdx];

    return (
        <Paper 
            elevation={4}
            sx={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                border: 1,
                borderColor: 'divider',
                borderRadius: 3,
                px: 4,
                py: 2,
                display: 'flex',
                gap: 4,
                zIndex: 100,
                backdropFilter: 'blur(8px)',
                minWidth: 500,
                justifyContent: 'space-around'
            }}
        >
            <StatItem label="SPEED" value={speedKmh} unit="km/h" color="primary.main" />
            <StatItem label="ACCEL" value={accel} unit="m/s²" color={Number(accel) > 0 ? 'secondary.main' : 'success.main'} />
            <StatItem label="YAW RATE" value={yawRateDeg} unit="°/s" />
            <StatItem label="HEADING" value={direction} unit={`(${deg.toFixed(0)}°)`} color="text.secondary" />
            
            {/* Divider */}
            <Box sx={{ width: 1, bgcolor: 'divider', mx: 1 }} />

            <StatItem 
                label="FPS" 
                value={fps.toString()} 
                color="warning.main" 
                history={history.fps} 
                min={0} 
                max={70} 
            />
            <StatItem 
                label="FRAME" 
                value={frameTime.toString()} 
                unit="ms" 
                color="warning.main" 
                history={history.frameTime} 
                min={0} 
                max={30} 
            />
        </Paper>
    );
}
