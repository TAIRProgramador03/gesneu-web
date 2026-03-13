import React, { memo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { convertToDateHuman } from '@/lib/utils';

interface ModalInspeccionObligatoriaProps {
  open: boolean;
  onClose: () => void;
  onRegistrarInspeccion: () => void;
  diffDias: number,
  fechaInspeccion: string,
  onContinuarReubicar: () => void
}

const ModalInspeccionAnterior: React.FC<ModalInspeccionObligatoriaProps> = memo(({ open, onClose, onRegistrarInspeccion, diffDias, fechaInspeccion, onContinuarReubicar }) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: 3, minWidth: 600, maxWidth: 700 } }}
  >
    <DialogContent sx={{ bgcolor: '#eaf6fb', borderRadius: 2, p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
        <FactCheckIcon color="primary" sx={{ fontSize: 48, mr: 2, mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
            INSPECCIÓN USABLE
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#222', mb: 1 }}>
            La última inspección ({convertToDateHuman(fechaInspeccion)}) de este vehiculo esta dentro de los 4 dias. ¿Deseas usar la misma o realizar una nueva inspección?.
          </Typography>
        </Box>
        <img
          src="/assets/inspeccionVehiculo.png"
          alt="Inspección Vehículo"
          style={{ width: 70, height: 70, marginLeft: 16, marginTop: 4, borderRadius: 8 }}
        />
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3, backgroundColor: '#eaf6fb', justifyContent: 'flex-end', gap: 2 }}>
      <Button
        onClick={onClose}
        color='primary'
        variant="outlined"
        size="large"
        sx={{ fontWeight: 'bold', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 13, textTransform: 'none', transition: 'all 0.2s' }}
      >
        Cerrar
      </Button>
      <Button
        onClick={onRegistrarInspeccion}
        variant="contained"
        size="large"
        sx={{ fontWeight: 'bold', backgroundColor: '#289d8c', color: '#fff', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 13, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#289d8c' } }}
      >
        Registrar nueva inspección
      </Button>
      <Button
        onClick={onContinuarReubicar}
        variant="contained"
        size="large"
        sx={{ fontWeight: 'bold', backgroundColor: '#1976d2', color: '#fff', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 13, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#115293' } }}
      >
        Continuar con la anterior inspección
      </Button>
    </DialogActions>
  </Dialog >
))

export default ModalInspeccionAnterior;
