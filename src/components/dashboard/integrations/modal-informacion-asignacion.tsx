'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { CalendarDays, CloudCheck, Gauge, Ruler, ShieldCheck, Wrench, X } from 'lucide-react';
import { Button as ButtonCustom } from '@/components/ui/button';
import { LoadingButton2 } from '@/components/ui/loading-button2';
import { convertToDateHuman } from '@/lib/utils';
import { NeumaticoPorAsignar } from '@/types/neumatico';

interface ModalInformacionAsignacionProps {
  open: boolean;
  kilometraje: string
  neumaticos: NeumaticoPorAsignar[]
  onClose: () => void;
  onSuccessInspeccion: () => Promise<void>
  placa: string;
}

/** Dato suelto del resumen superior. */
const DatoResumen: React.FC<{ icono: React.ReactNode; label: string; valor: React.ReactNode }> = ({ icono, label, valor }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-indigo-50 px-3 py-2.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-200">
      {icono}
    </span>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-400">{label}</p>
      <p className="truncate text-sm font-bold text-slate-800">{valor}</p>
    </div>
  </div>
);

/** Medida individual dentro de la tarjeta de un neumático. */
const Medida: React.FC<{ icono: React.ReactNode; label: string; valor: React.ReactNode; unidad: string }> = ({ icono, label, valor, unidad }) => (
  <div className="rounded-lg border border-slate-200/70 bg-white px-2.5 py-1.5">
    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-400">
      {icono}
      {label}
    </p>
    <p className="mt-0.5 text-sm font-bold text-slate-700">
      {valor ?? '—'}
      <span className="ml-0.5 text-xs font-semibold text-slate-400">{unidad}</span>
    </p>
  </div>
);

export const ModalInformacionAsignacion = ({ open, kilometraje, neumaticos = [], onClose, onSuccessInspeccion, placa }: ModalInformacionAsignacionProps) => {
  const theme = useTheme();
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'));

  // La fecha de asignación es la misma para todos (el modal anterior lo valida)
  const fechaAsignacion = neumaticos[0]?.FechaAsignacion ?? '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={esPantallaChica}
      PaperProps={{ sx: { borderRadius: { xs: 0, md: 3 }, overflow: 'hidden' } }}
    >
      {/* Franja de color superior */}
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)' }} />

      <DialogTitle sx={{ pb: 1.5, pt: 2, px: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, borderRadius: 2,
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
          flexShrink: 0,
        }}>
          <ShieldCheck size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Reconfirmar Asignación
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
            <Chip
              label={placa}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.875rem', bgcolor: '#f1f5f9', color: '#334155', letterSpacing: 0.5 }}
            />
          </Box>
          <Typography variant="caption" className='text-amber-600' sx={{ display: 'block', mt: 1, fontStyle: 'italic', fontSize: { xs: '0.75rem', md: '0.875rem' }, lineHeight: 1.35 }}>
            <span className='font-bold'>Nota: </span>
            Revisa que los datos sean correctos. Al pulsar <b>Registrar Asignación</b> se guardarán definitivamente.
          </Typography>
        </Box>

        <ButtonCustom
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="Cerrar"
          aria-label="Cerrar"
          className="shrink-0 self-start text-slate-400 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </ButtonCustom>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, px: { xs: 1.5, md: 3 }, bgcolor: '#f8fafc' }}>
        {/* Resumen de la operación */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mt-3">
          <DatoResumen
            icono={<Gauge className="h-4 w-4" />}
            label="Kilometraje"
            valor={`${Number(kilometraje || 0).toLocaleString()} km`}
          />
          <DatoResumen
            icono={<CalendarDays className="h-4 w-4" />}
            label="Fecha de asignación"
            valor={convertToDateHuman(fechaAsignacion) || '—'}
          />
          <DatoResumen
            icono={<ShieldCheck className="h-4 w-4" />}
            label="Neumáticos a montar"
            valor={`${neumaticos.length} ${neumaticos.length === 1 ? 'unidad' : 'unidades'}`}
          />
        </div>

        {/* Detalle por posición */}
        <p className="mb-2 mt-4 text-sm font-semibold text-slate-700">Detalle por posición</p>

        {neumaticos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            No hay neumáticos por asignar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {neumaticos.map((neu) => {
              const esRepuesto = neu.Posicion === 'RES01';
              return (
                <div
                  key={neu.Posicion}
                  className="relative overflow-hidden rounded-xl border border-violet-100 bg-linear-to-r from-violet-50/60 via-white to-slate-50 p-3 pl-4 shadow-sm"
                >
                  <span className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-violet-300 to-violet-500" />

                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 font-mono text-xs font-extrabold text-white">
                      {neu.Posicion}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{neu.CodigoNeumatico || '—'}</p>
                      <p className="truncate text-xs text-slate-500">{neu.Marca || '—'}</p>
                    </div>
                    {esRepuesto && (
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                        REPUESTO
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                    <Medida icono={<Ruler className="h-3 w-3" />} label="Reman." valor={neu.Remanente} unidad="mm" />
                    <Medida icono={<Gauge className="h-3 w-3" />} label="Presión" valor={neu.PresionAire} unidad="psi" />
                    <Medida icono={<Wrench className="h-3 w-3" />} label="Torque" valor={neu.TorqueAplicado} unidad="N·m" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3 }, py: 1.5,
          borderTop: '1px solid', borderColor: 'divider',
          gap: 1.5,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'flex-end',
          '& > button': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' },
        }}
      >
        <ButtonCustom variant="outline" onClick={onClose}>
          Cerrar
        </ButtonCustom>
        <LoadingButton2
          variant="primary"
          icon={<CloudCheck />}
          onClick={() => onSuccessInspeccion()}
        >
          Registrar Asignación
        </LoadingButton2>
      </DialogActions>
    </Dialog>
  );
};
