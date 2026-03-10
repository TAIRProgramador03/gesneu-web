import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Receipt as ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';

export interface TotalProfitProps {
  sx?: SxProps;
  value: string;
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
            <Typography variant="h4">{value}</Typography>
          </Stack>
          <Stack sx={{ position: 'relative', width: 75, height: 75 }}>
            <img src="/assets/hand-tyre.png" alt="Neumático Asignado" style={{ width: 130, height: 130, position: 'absolute', top: -28, left: -25, zIndex: 1, opacity: 1, objectFit: 'contain' }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
