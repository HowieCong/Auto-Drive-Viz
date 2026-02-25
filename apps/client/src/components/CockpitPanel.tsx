import type { EgoState } from '../types';
import { Box, Typography, Paper } from '@mui/material';

interface CockpitPanelProps {
    ego: EgoState | null;
}

interface StatItemProps {
    label: string;
    value: string;
    unit?: string;
    color?: string;
}

const StatItem = ({ label, value, unit, color = 'white' }: StatItemProps) => (
    <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{label}</Typography>
        <Typography variant="h5" sx={{ color, fontFamily: 'monospace', fontWeight: 'bold' }}>
            {value} {unit && <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography>}
        </Typography>
    </Box>
);

export function CockpitPanel({ ego }: CockpitPanelProps) {
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
                gap: 5,
                zIndex: 100,
                backdropFilter: 'blur(8px)'
            }}
        >
            <StatItem label="SPEED" value={speedKmh} unit="km/h" color="primary.main" />
            <StatItem label="ACCEL" value={accel} unit="m/s²" color={Number(accel) > 0 ? 'secondary.main' : 'success.main'} />
            <StatItem label="YAW RATE" value={yawRateDeg} unit="°/s" />
            <StatItem label="HEADING" value={direction} unit={`(${deg.toFixed(0)}°)`} color="text.secondary" />
        </Paper>
    );
}
