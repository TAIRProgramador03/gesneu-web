import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import CountUp from 'react-countup';

export interface BudgetProps {
  diff?: number;
  trend: 'up' | 'down';
  sx?: SxProps;
  value: number;
}

export function Budget({ diff, trend, sx, value }: BudgetProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="overline">
                Cantidad de Neumáticos
              </Typography>
              <Typography variant="h4">
                <CountUp end={value} duration={.8} />
              </Typography>
            </Stack>
            <Stack sx={{ width: 115, objectFit: 'cover' }}>
              <Image src="/assets/cantidad.png" alt="Neumático" width={115} height={115} style={{ width: 115, height: 115, zIndex: 1, opacity: 1 }} />
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card >
  );
}
