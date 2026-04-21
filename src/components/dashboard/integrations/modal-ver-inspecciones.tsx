'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { ChevronRight, ClipboardList, RefreshCw, Tally1 } from 'lucide-react';
import { getInspeccionesPorPlaca, getNeumaticosPorInspeccion } from '@/api/Neumaticos';
import { useQuery } from '@tanstack/react-query';
import { Card, Stack } from '@mui/material';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { columnsInspecciones, columnsNeuInspeccion } from '@/app/integrations/columns';
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

const SkeletonTable = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1 }}>
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} variant="rounded" height={38} sx={{ borderRadius: 2, opacity: 1 - i * 0.15 }} />
    ))}
  </Box>
);

export const ModalVerInspecciones = ({ open, onClose, placa }: ModalVerInspeccionesProps) => {

  const [inspeccion, setInspeccion] = useState<InspeccionRef | null>(null);

  const columnsInspeccionesUp = columnsInspecciones((row) => {
    if (!row.FECHA_INSPECCION) return;
    setInspeccion({ PLACA: row.PLACA, FECHA_INSPECCION: row.FECHA_INSPECCION });
  });

  const { data: inspeccionesPorPlaca = [], isLoading: loadingInspecciones, refetch: refetchInspeccionesPorPlaca } = useQuery({
    queryKey: ['inspecciones-placa', { placa }],
    queryFn: () => getInspeccionesPorPlaca(placa),
  })

  const { data: neumaticosPorInspeccion = [], isLoading: loadingNeumaticos } = useQuery({
    queryKey: ['neumaticos-de-inspeccion', { currentInspeccion: inspeccion }],
    queryFn: () => getNeumaticosPorInspeccion(inspeccion),
    staleTime: 1000 * 60 * 10,
    enabled: !!inspeccion,
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
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
          <ClipboardList size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Historial de Inspecciones
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
            <Chip
              label={placa}
              size="small"
              sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
            />
            {!loadingInspecciones && (
              <Chip
                label={`${inspeccionesPorPlaca.length} inspección${inspeccionesPorPlaca.length !== 1 ? 'es' : ''}`}
                size="small"
                sx={{ fontWeight: 500, fontSize: 11, bgcolor: '#eff6ff', color: '#2563eb' }}
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, bgcolor: '#f8fafc' }}>
        <Stack direction="row" spacing={3}>

          {/* Panel izquierdo */}
          <Card sx={{ flex: 1, p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '10px' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                <Tally1 size={12} />
                Inspecciones registradas
              </span>
              {!loadingInspecciones && inspeccionesPorPlaca.length > 0 && (
                <span className="text-xs text-slate-400">{inspeccionesPorPlaca.length} total</span>
              )}
            </Box>

            <div className='flex mb-3 justify-end'>
              <ButtonCustom
                size="icon"
                variant={'life'}
                onClick={() => refetchInspeccionesPorPlaca()}
              >
                <RefreshCw />
              </ButtonCustom>
            </div>

            {loadingInspecciones
              ? <SkeletonTable />
              : <DataTableNeumaticos columns={columnsInspeccionesUp} data={inspeccionesPorPlaca} type='pagination' />
            }
          </Card>

          {/* Panel derecho */}
          <Card sx={{
            flex: 1, p: 2.5,
            maxWidth: 900, minWidth: 320, width: '100%',
            borderRadius: 2.5,
            border: '2px solid #bfdbfe',
            background: inspeccion ? '#fff' : 'linear-gradient(135deg, #f0f7ff 0%, #f5f3ff 100%)',
            transition: 'background 0.3s ease',
            marginTop: '10px'
          }} elevation={0}>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                <ClipboardList size={12} />
                {`Detalle de neumáticos${neumaticosPorInspeccion.length > 0 ? ` (${neumaticosPorInspeccion.length})` : ''}`}
              </span>
              {inspeccion && (
                <Chip
                  label={convertToDateHuman(inspeccion.FECHA_INSPECCION ?? '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
              )}
            </Box>

            {!inspeccion && (
              <Box sx={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 260, gap: 2,
              }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} className="animate-pulse">
                  <ClipboardList size={30} className="text-blue-400" />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Sin inspección seleccionada
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Haz clic en una inspección del panel izquierdo
                  </Typography>
                </Box>
              </Box>
            )}

            {inspeccion && (
              loadingNeumaticos
                ? <SkeletonTable />
                : <DataTableNeumaticos columns={columnsNeuInspeccion} data={neumaticosPorInspeccion} />
            )}
          </Card>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ButtonCustom onClick={onClose} >
          Cerrar
        </ButtonCustom>
      </DialogActions>
    </Dialog>
  );
};
