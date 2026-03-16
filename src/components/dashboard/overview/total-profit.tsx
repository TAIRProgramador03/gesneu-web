import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import CountUp from 'react-countup';

export interface TotalProfitProps {
  sx?: SxProps;
  value: number;
}

export function TotalProfit({ value, sx }: TotalProfitProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="overline">
              Costo neumáticos asignados
            </Typography>
            <Typography variant="h4">
              $
              <CountUp end={value} />
            </Typography>
          </Stack>
          <Stack sx={{ width: 115, objectFit: 'contain' }}>
            <Image src="/assets/hand-tyre.png" alt="Neumático Asignado" width={115} height={115} style={{ width: 115, height: 115, zIndex: 1, opacity: 1, objectFit: 'contain' }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
