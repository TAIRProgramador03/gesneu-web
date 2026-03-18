'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getInspeccionesPorPlaca, getNeumaticosPorInspeccion } from '@/api/Neumaticos';
import { useQuery } from '@tanstack/react-query';
import { Card, Stack } from '@mui/material';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsInspecciones, columnsNeuInspeccion } from '@/app/dashboard/integrations/columns';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';

interface ModalVerInspeccionesProps {
  open: boolean;
  onClose: () => void;
  placa: string;
}

interface InspeccionRef {
  PLACA: string,
  FECHA_INSPECCION: string
}

export const ModalVerInspecciones = ({ open, onClose, placa }: ModalVerInspeccionesProps) => {

  const [inspeccion, setInspeccion] = useState<InspeccionRef | null>(null);

  const columnsInspeccionesUp = columnsInspecciones((row) => {
    if (!row.FECHA_INSPECCION) return;
    setInspeccion({ PLACA: row.PLACA, FECHA_INSPECCION: row.FECHA_INSPECCION });
  });

  const { data: inspeccionesPorPlaca = [] } = useQuery({
    queryKey: ['inspecciones-placa', { placa }],
    queryFn: () => getInspeccionesPorPlaca(placa)
  })

  const { data: neumaticosPorInspeccion = [] } = useQuery({
    queryKey: ['neumaticos-de-inspeccion', { currentInspeccion: inspeccion }],
    queryFn: () => getNeumaticosPorInspeccion(inspeccion),
    staleTime: 1000 * 60 * 10,
    enabled: !!inspeccion,
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        Historial de Inspecciones
        <Typography variant="body2" color="text.secondary">Placa: {placa}</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>

        <Stack direction="row" spacing={3}>

          <Card sx={{ flex: 1, p: 2, minWidth: 320, maxWidth: 580 }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Selecciona una inspección
            </Typography>

            <DataTableNeumaticos columns={columnsInspeccionesUp} data={inspeccionesPorPlaca} type='pagination' />
          </Card>

          <Card sx={{
            flex: 1, p: 2,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            maxWidth: 900, minWidth: 320, width: '100%',
          }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Neumáticos de la Inspección
            </Typography>

            {inspeccion ? (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <Box component="span" fontWeight="bold" fontStyle="italic">
                  Fecha de inspección:
                </Box>{' '}
                {convertToDateHuman(inspeccion.FECHA_INSPECCION ?? '')}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 4, textAlign: 'center' }}>
                Selecciona una inspección para ver sus neumáticos
              </Typography>
            )}

            {inspeccion && (
              <DataTableNeumaticos columns={columnsNeuInspeccion} data={neumaticosPorInspeccion} />
            )}
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <ButtonCustom onClick={onClose} >
          Cerrar
        </ButtonCustom>
      </DialogActions>
    </Dialog>
  );
};
