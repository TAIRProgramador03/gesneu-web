import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { ArrowDown as ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';

export interface RecuperadosProps {
  diff?: number;
  trend: 'up' | 'down';
  sx?: SxProps;
  value: string;
}

export function Recuperados({ diff, trend, sx, value }: RecuperadosProps): React.JSX.Element {
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = trend === 'up' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)';

  return (
    <Card sx={{ ...sx, border: '2px solid #2196f3' }}> {/* Borde azul para recuperados */}
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="overline">
                Recuperados
              </Typography>
              <Typography variant="h4" sx={{ color: '#2196f3' }}>{value}</Typography>
            </Stack>
            <Stack sx={{ position: 'relative', width: 75, height: 75 }}>
              <Avatar
                sx={{
                  backgroundColor: 'var(--mui-palette-success-main)',
                  height: '56px',
                  width: '56px',
                }}
              >
                ♻️
              </Avatar>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
