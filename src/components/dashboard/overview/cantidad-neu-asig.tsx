import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import CountUp from 'react-countup';

export interface TasksProgressProps {
  sx?: SxProps;
  value: number;
}

export function TasksProgress({ value, sx }: TasksProgressProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" gutterBottom variant="overline">
                neumáticos asignados
              </Typography>
              <Typography variant="h4">
                <CountUp end={value} />
              </Typography>
            </Stack>
            <Stack sx={{ width: 115, objectFit: 'cover' }}>
              <Image src="/assets/asignados.png" alt="Neumático Asignado" width={115} height={115} style={{ width: 115, height: 115, zIndex: 1, opacity: 1 }} />
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
