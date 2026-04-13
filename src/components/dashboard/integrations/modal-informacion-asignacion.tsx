'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { CloudCheck, ShieldCheck, Tally1 } from 'lucide-react';
import { Card } from '@mui/material';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsNeuPorAsignar } from '@/app/dashboard/integrations/columns';
import { NeumaticoPorAsignar } from '@/types/neumatico';

interface ModalVerInspeccionesProps {
  open: boolean;
  kilometraje: string
  neumaticos: NeumaticoPorAsignar[]
  onClose: () => void;
  onSuccessInspeccion: () => Promise<void>
  placa: string;
}

export const ModalInformacionAsignacion = ({ open, kilometraje, neumaticos = [], onClose, onSuccessInspeccion, placa }: ModalVerInspeccionesProps) => {

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' }
      }}
    >
      {/* Franja de color superior */}
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 2,
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
          flexShrink: 0,
        }}>
          <ShieldCheck size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Confirmar Asignación
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
            <Chip
              label={placa}
              size="small"
              sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
            />
          </Box>
          <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            <span className='font-bold'>Nota: </span>
            Aquí podrás visualizar los datos para tu asignación vehicular. Confirmar que la información mostrada es la correcta.
            <br />
            Para guardar la asignación: <b>Registrar Asignación</b>
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, bgcolor: '#f8fafc' }}>

        <Card sx={{ flex: 1, p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '10px' }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-600 text-sm font-normal">
              <Tally1 size={16} />
              Kilometraje:
              <b>{kilometraje} km</b>
            </span>
          </Box>
          <DataTableNeumaticos columns={columnsNeuPorAsignar} data={neumaticos} />
        </Card>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <LoadingButton2
          variant="primary"
          icon={<CloudCheck />}
          onClick={() => onSuccessInspeccion()}
        >
          Registrar Asignación
        </LoadingButton2>
        <ButtonCustom onClick={onClose} >
          Cerrar
        </ButtonCustom>
      </DialogActions>
    </Dialog>
  );
};
