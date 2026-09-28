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
import { Card, Stack, useMediaQuery, useTheme } from '@mui/material';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Gauge,
  RefreshCw,
  Route,
  StickyNote,
  X,
} from 'lucide-react';
import { getInspeccionesPorPlaca, getNeumaticosPorInspeccion } from '@/api/Neumaticos';
import { useQuery } from '@tanstack/react-query';
import { convertToDateHuman } from '@/lib/utils';
import { Button as ButtonCustom } from '@/components/ui/button';
import { TipoTerrenoBadge } from '@/components/ui/TipoTerrenoBadge';
import { TipoRetenBadge } from '@/components/ui/TipoRetenBadge';
import type { InspeccionTable } from '@/types/inspecciones';
import type { NeuInspeccionTable } from '@/types/neumatico';

interface ModalVerInspeccionesProps {
  open: boolean;
  onClose: () => void;
  placa: string;
}

interface InspeccionRef {
  PLACA: string,
  FECHA_INSPECCION: string
}

/** Mismo lenguaje de color que la lista de neumáticos instalados. */
const ACENTOS = {
  critico: { franja: 'from-rose-300 to-rose-500', fondo: 'from-rose-50/70', chip: 'border-rose-200 bg-rose-50 text-rose-700', texto: 'text-rose-600', barra: 'bg-rose-500' },
  medio: { franja: 'from-amber-300 to-amber-500', fondo: 'from-amber-50/70', chip: 'border-amber-200 bg-amber-50 text-amber-700', texto: 'text-amber-600', barra: 'bg-amber-500' },
  optimo: { franja: 'from-emerald-300 to-emerald-500', fondo: 'from-emerald-50/70', chip: 'border-emerald-200 bg-emerald-50 text-emerald-700', texto: 'text-emerald-600', barra: 'bg-emerald-500' },
} as const;

const acentoPorVida = (pct: number) => (pct < 39 ? ACENTOS.critico : pct < 79 ? ACENTOS.medio : ACENTOS.optimo);

const SkeletonTarjetas = ({ alto = 72 }: { alto?: number }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1 }}>
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} variant="rounded" height={alto} sx={{ borderRadius: 3, opacity: 1 - i * 0.18 }} />
    ))}
  </Box>
);

/** Tarjeta de una inspección del historial. */
const TarjetaInspeccion: React.FC<{
  inspeccion: InspeccionTable;
  activa: boolean;
  onSeleccionar: () => void;
}> = ({ inspeccion, activa, onSeleccionar }) => (
  <button
    type="button"
    onClick={onSeleccionar}
    // shrink-0: la lista es un flex column con max-height; sin esto las tarjetas se aplastan
    // en vez de hacer scroll y el overflow-hidden les recorta los badges.
    className={`group relative w-full shrink-0 overflow-hidden rounded-xl border px-4 py-3 pl-5 text-left transition-all duration-150 ${activa
      ? 'border-blue-300 bg-linear-to-r from-blue-50 via-white to-slate-50 shadow-md'
      : 'border-slate-200/80 bg-linear-to-r from-white to-slate-50/70 shadow-sm hover:-translate-y-px hover:border-blue-200 hover:shadow-md'
      }`}
  >
    <span className={`absolute inset-y-0 left-0 w-1.5 bg-linear-to-b ${activa ? 'from-blue-400 to-indigo-500' : 'from-slate-200 to-slate-300'}`} />

    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activa ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <CalendarDays className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {convertToDateHuman(inspeccion.FECHA_INSPECCION ?? '') || '—'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Gauge className="h-3 w-3 text-slate-400" />
            {Number(inspeccion.KILOMETRAJE ?? 0).toLocaleString()} km
          </span>
          {inspeccion.FECHA_TIEMPO && (
            <span className="text-slate-400">Reg. {convertToDateHuman(inspeccion.FECHA_TIEMPO)}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {inspeccion.TIPO_TERRENO && <TipoTerrenoBadge tipo={inspeccion.TIPO_TERRENO} />}
          {inspeccion.RETEN && <TipoRetenBadge tipo={inspeccion.RETEN} />}
        </div>
      </div>

      <ChevronRight className={`h-4 w-4 shrink-0 ${activa ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'}`} />
    </div>
  </button>
);

/** Tarjeta de un neumático dentro de la inspección seleccionada. */
const TarjetaNeumaticoInspeccion: React.FC<{ neumatico: NeuInspeccionTable }> = ({ neumatico }) => {
  const [abierto, setAbierto] = useState(false);
  const vida = Number(neumatico.PORCENTAJE_VIDA ?? 0);
  const acento = acentoPorVida(vida);
  const hayObs = Boolean(neumatico.OBS && String(neumatico.OBS).trim());

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border bg-linear-to-r ${acento.fondo} via-white to-slate-100/70 transition-all duration-150 ${abierto ? 'border-slate-300 shadow-md' : 'border-slate-200/80 shadow-sm'
      }`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-linear-to-b ${acento.franja}`} />

      <button
        type="button"
        onClick={() => hayObs && setAbierto(!abierto)}
        className={`flex w-full items-center gap-3 py-2.5 pl-5 pr-3 text-left ${hayObs ? 'hover:bg-slate-50/50' : 'cursor-default'}`}
      >
        <span className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-extrabold ${acento.chip}`}>
          {neumatico.POSICION || '—'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-800">{neumatico.CODIGO || '—'}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Route className="h-3 w-3 text-slate-400" />
            {Number(neumatico.KM_RECORRIDO ?? 0).toLocaleString()} km recorridos
          </span>
        </span>

        <span className="shrink-0 text-center">
          <span className={`block text-[15px] font-extrabold leading-none ${acento.texto}`}>
            {neumatico.REMANENTE ?? '—'}
            <span className="ml-0.5 text-[10px] font-bold">mm</span>
          </span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate-400">remanente</span>
        </span>

        <span className="hidden w-20 shrink-0 sm:block">
          <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
            <span className={`block h-full rounded-full ${acento.barra}`} style={{ width: `${Math.min(100, Math.max(0, vida))}%` }} />
          </span>
          <span className={`mt-1 block text-[10px] font-bold ${acento.texto}`}>{vida}% vida</span>
        </span>

        {hayObs ? (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}>
            <ChevronDown size={15} />
          </span>
        ) : (
          <span className="w-7 shrink-0" />
        )}
      </button>

      {hayObs && (
        <div className={`grid transition-all duration-200 ease-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="flex items-start gap-2 border-t border-slate-200 bg-slate-100/70 px-4 py-3 pl-5">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Observación</p>
                <p className="mt-0.5 text-[13px] text-slate-700">{neumatico.OBS}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ModalVerInspecciones = ({ open, onClose, placa }: ModalVerInspeccionesProps) => {
  const [inspeccion, setInspeccion] = useState<InspeccionRef | null>(null);

  // En pantallas chicas el modal funciona como maestro/detalle: primero el historial,
  // y al elegir una inspección se muestra el detalle con opción de volver.
  const theme = useTheme();
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('lg'));

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

  const mostrarDetalle = !esPantallaChica || Boolean(inspeccion);
  const mostrarHistorial = !esPantallaChica || !inspeccion;

  const panelHistorial = (
    <Card
      sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, md: 2.5 }, borderRadius: 2.5, border: '1px solid #e2e8f0', marginTop: '10px' }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <CalendarDays size={12} />
          Inspecciones registradas
          {!loadingInspecciones && inspeccionesPorPlaca.length > 0 && (
            <span className="ml-1 text-slate-400">({inspeccionesPorPlaca.length})</span>
          )}
        </span>

        <ButtonCustom size="icon" variant="life" onClick={() => refetchInspeccionesPorPlaca()} title="Actualizar">
          <RefreshCw />
        </ButtonCustom>
      </Box>

      {loadingInspecciones ? (
        <SkeletonTarjetas alto={86} />
      ) : inspeccionesPorPlaca.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
          <CalendarDays className="h-5 w-5 text-slate-300" />
          <p className="text-sm text-slate-400">Este vehículo aún no tiene inspecciones registradas.</p>
        </div>
      ) : (
        <div className="flex max-h-[58vh] flex-col gap-2 overflow-auto pr-0.5">
          {inspeccionesPorPlaca.map((insp: InspeccionTable, i: number) => (
            <TarjetaInspeccion
              key={insp.ID ?? `${insp.FECHA_INSPECCION}-${i}`}
              inspeccion={insp}
              activa={inspeccion?.FECHA_INSPECCION === insp.FECHA_INSPECCION}
              onSeleccionar={() => {
                if (!insp.FECHA_INSPECCION) return;
                setInspeccion({ PLACA: insp.PLACA, FECHA_INSPECCION: insp.FECHA_INSPECCION });
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );

  const panelDetalle = (
    <Card
      sx={{
        flex: 1, minWidth: 0, p: { xs: 1.5, md: 2.5 },
        borderRadius: 2.5,
        border: '2px solid #bfdbfe',
        background: inspeccion ? '#fff' : 'linear-gradient(135deg, #f0f7ff 0%, #f5f3ff 100%)',
        transition: 'background 0.3s ease',
        marginTop: '10px'
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
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

      {esPantallaChica && inspeccion && (
        <div className="mb-3">
          <ButtonCustom variant="outline" size="sm" onClick={() => setInspeccion(null)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al historial
          </ButtonCustom>
        </div>
      )}

      {!inspeccion && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 2 }}>
          <Box
            sx={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            className="animate-pulse"
          >
            <ClipboardList size={30} className="text-blue-400" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Sin inspección seleccionada
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Elige una inspección del historial para ver sus neumáticos
            </Typography>
          </Box>
        </Box>
      )}

      {inspeccion && (
        loadingNeumaticos ? (
          <SkeletonTarjetas />
        ) : neumaticosPorInspeccion.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
            <ClipboardList className="h-5 w-5 text-slate-300" />
            <p className="text-sm text-slate-400">Esta inspección no tiene neumáticos registrados.</p>
          </div>
        ) : (
          <div className="flex max-h-[58vh] flex-col gap-2 overflow-auto pr-0.5">
            {neumaticosPorInspeccion.map((neu: NeuInspeccionTable, i: number) => (
              <TarjetaNeumaticoInspeccion key={neu.ID_NEUMATICO ?? `${neu.CODIGO}-${i}`} neumatico={neu} />
            ))}
          </div>
        )
      )}
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={esPantallaChica}
      PaperProps={{ sx: { borderRadius: { xs: 0, lg: 3 }, overflow: 'hidden' } }}
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
          <ClipboardList size={20} className="text-blue-600" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ fontSize: { xs: 16, md: 20 } }}>
            Historial de Inspecciones
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
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

      <DialogContent sx={{ pt: 2, px: { xs: 1.5, md: 3 }, bgcolor: '#f8fafc' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 2, lg: 3 }}>
          {mostrarHistorial && panelHistorial}
          {mostrarDetalle && panelDetalle}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ButtonCustom onClick={onClose}>
          Cerrar
        </ButtonCustom>
      </DialogActions>
    </Dialog>
  );
};
