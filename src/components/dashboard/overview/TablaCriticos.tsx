'use client';

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { obtenerNeumaticosEnCritico } from '@/api/Neumaticos';
import { LinearProgressItem } from '@/components/ui/LinearProgress';

function getDiasStyle(dias: number): React.CSSProperties {
  if (dias <= 10) return { color: '#EF4444', fontWeight: 700 };
  if (dias <= 30) return { color: '#F59E0B', fontWeight: 700 };
  return { color: '#6B7280', fontWeight: 600 };
}

export const TablaCriticos = (): React.JSX.Element => {
  const theme = useTheme();
  const router = useRouter();

  const { data: neumaticosEnCritico = [] } = useQuery({
    queryKey: ['neumaticos-en-critico'],
    queryFn: obtenerNeumaticosEnCritico
  })

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      {/* Badge count */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          borderRadius: 20, padding: '3px 11px', whiteSpace: 'nowrap',
        }}
          className='bg-red-100 text-red-600 border border-red-600'
        >
          {neumaticosEnCritico.length} neumáticos
        </span>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            {['Código', 'Placa', 'Marca', 'Presión', 'Torque', 'Remanente', 'Estado'].map((h) => (
              <TableCell
                key={h}
                sx={{
                  fontSize: 11, fontWeight: 700,
                  color: 'text.secondary',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 0.8, px: 1,
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {neumaticosEnCritico.map((neu) => (
            <TableRow
              key={neu.ID_NEUMATICO}
              hover
              sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
              onClick={() => {
                router.push(`/padron/neumatico/${neu.CODIGO_NEUMATICO}`)
              }}
            >
              <TableCell sx={{ fontSize: 12, fontWeight: 600, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                {neu.CODIGO_NEUMATICO}
              </TableCell>
              <TableCell sx={{ fontSize: 12, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                {neu.PLACA_VEHICULO}
              </TableCell>
              <TableCell sx={{ fontSize: 12, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.secondary' }}>
                {neu.MARCA_NEUMATICO}
              </TableCell>
              <TableCell sx={{ fontSize: 12, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                {neu.PRESION_NEUMATICO}
              </TableCell>
              <TableCell sx={{ fontSize: 12, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                {neu.TORQUE_NEUMATICO}
              </TableCell>
              <TableCell sx={{ fontSize: 12, py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                {neu.REMANENTE_NEUMATICO} mm
              </TableCell>
              <TableCell sx={{ py: 0.9, px: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <LinearProgressItem width='120px' estado={neu.PORCENTAJE_VIDA} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
