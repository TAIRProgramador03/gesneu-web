
import { Box, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { ClipboardList, CloudBackup, CloudCheck, RefreshCw, ShieldCheck, Tally1 } from 'lucide-react';
import React from 'react'
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';

interface ModalActualizarKilometraje {
  open: boolean
  onClose: () => void;
  placa: string
}

export const ModalActualizarKilometraje = ({ open, onClose, placa }: ModalActualizarKilometraje) => {

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
          <CloudBackup size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Actualizar Kilometraje
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
            Aquí podrás actualizar el kilometraje asignado al primer montaje o en su defecto a la última inspección.
            <br />
            Para guardar: <b>Actualizar Kilometraje</b>
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, bgcolor: '#f8fafc' }}>

        <Card sx={{ flex: 1, p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '10px' }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <h4>Hola a todos!</h4>
          </Box>

          {/* <DataTableNeumaticos columns={columnsNeuPorAsignar} data={neumaticos} /> */}

          <span>
            {placa}
          </span>


        </Card>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        {/* <LoadingButton2
          variant="primary"
          icon={<CloudCheck />}
        // onClick={() => onSuccessInspeccion()}
        >
          Registrar Asignación
        </LoadingButton2> */}
        <ButtonCustom onClick={onClose} >
          Cerrar
        </ButtonCustom>
      </DialogActions>
    </Dialog>
  );
}

