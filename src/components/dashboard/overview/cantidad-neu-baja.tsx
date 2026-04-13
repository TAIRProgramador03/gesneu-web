import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CountUp from 'react-countup';

export interface BajaDefinitivaProps {
  diff?: number;
  trend: 'up' | 'down';
  sx?: SxProps;
  value: number;
}

export function BajaDefinitiva({ diff, trend, sx, value }: BajaDefinitivaProps): React.JSX.Element {
  return (
    <Card sx={{ ...sx, border: '2px solid #f57c00' }}> {/* Borde naranja para baja definitiva */}
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="overline">
                Baja Definitiva
              </Typography>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                <CountUp end={value} duration={.8} />
              </Typography>
            </Stack>
            <Stack sx={{ position: 'relative', width: 75, height: 75 }}>
              <Avatar
                sx={{
                  backgroundColor: 'var(--mui-palette-error-main)',
                  height: '56px',
                  width: '56px',
                }}
              >
                <WarningAmberIcon />
              </Avatar>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
