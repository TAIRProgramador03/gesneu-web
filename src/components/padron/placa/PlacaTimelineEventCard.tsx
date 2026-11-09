import { MovimientoAgrupado } from './PlacaTimeline'
import { NeumaticoDelHistorial } from '@/api/Neumaticos'
import { cn, convertToDateHuman } from '@/lib/utils'
import {
  ArrowRight,
  ChevronDown,
  CircleDot,
  Gauge,
  MapPin,
  MessageSquare,
  PackageMinus,
  PackagePlus,
  Recycle,
  Activity,
  Building2,
  Mountain,
  RefreshCw,
  Route,
  Search,
  User,
  Wind,
  Wrench,
} from 'lucide-react'
import React, { useState } from 'react'

function timelineIconBg(tipo: number) {
  switch (tipo) {
    case 2: return 'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-300 border-green-200 dark:border-green-500/30'
    case 4: return 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
    case 5: return 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30'
    case 6: return 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
    case 7: return 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
    default: return 'bg-gray-100 dark:bg-superficie-2 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
  }
}

function timelineIcon(tipo: number) {
  const cls = 'size-4'
  switch (tipo) {
    case 2: return <PackagePlus className={cls} />
    case 4: return <RefreshCw className={cls} />
    case 5: return <PackageMinus className={cls} />
    case 6: return <Recycle className={cls} />
    case 7: return <Search className={cls} />
    default: return <CircleDot className={cls} />
  }
}

function timelineLineColor(tipo: number) {
  switch (tipo) {
    case 2: return 'from-green-300 to-green-100 dark:to-green-500/15'
    case 4: return 'from-indigo-300 to-indigo-100 dark:to-indigo-500/15'
    case 5: return 'from-red-300 to-red-100 dark:to-red-500/15'
    case 6: return 'from-cyan-300 to-cyan-100 dark:to-cyan-500/15'
    case 7: return 'from-amber-300 to-amber-100 dark:to-amber-500/15'
    default: return 'from-gray-300 to-gray-100 dark:to-superficie-2'
  }
}

function timelineCardAccent(tipo: number) {
  const base: Record<number, { stripe: string; ring: string; chip: string; badge: string }> = {
    2: { stripe: 'bg-green-400', ring: 'ring-green-100 dark:ring-green-500/20 border-green-200 dark:border-green-500/30', chip: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' },
    4: { stripe: 'bg-indigo-400', ring: 'ring-indigo-100 dark:ring-indigo-500/20 border-indigo-200 dark:border-indigo-500/30', chip: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
    5: { stripe: 'bg-red-400', ring: 'ring-red-100 dark:ring-red-500/20 border-red-200 dark:border-red-500/30', chip: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' },
    6: { stripe: 'bg-cyan-400', ring: 'ring-cyan-100 dark:ring-cyan-500/20 border-cyan-200 dark:border-cyan-500/30', chip: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300', badge: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
    7: { stripe: 'bg-amber-400', ring: 'ring-amber-100 dark:ring-amber-500/20 border-amber-200 dark:border-amber-500/30', chip: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300', badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  }
  return base[tipo] ?? { stripe: 'bg-gray-400', ring: 'ring-gray-100 border-gray-200 dark:border-slate-700', chip: 'bg-gray-50 dark:bg-superficie-1 text-gray-700 dark:text-slate-200', badge: 'bg-gray-100 dark:bg-superficie-2 text-gray-700 dark:text-slate-200' }
}

function NeuRow({ neu, tipo }: { neu: NeumaticoDelHistorial; tipo: number }) {
  const accent = timelineCardAccent(tipo)
  const obs = neu.OBSERVACION?.trim()
  const posDisplay = neu.POSICION_NUEVA_EN_VEHICULO ?? neu.POSICION_ANTERIOR_EN_VEHICULO

  return (
    <div className="rounded-lg bg-gray-50 dark:bg-superficie-1 p-2.5 space-y-1.5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className={cn('text-xs font-bold rounded px-2 py-0.5 shrink-0', accent.badge)}>
          {neu.CODIGO_NEUMATICO}
        </span>
        {tipo === 4 && neu.POSICION_ANTERIOR_EN_VEHICULO && neu.POSICION_NUEVA_EN_VEHICULO ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 min-w-0">
            <span className="flex items-center gap-1 text-gray-400">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{neu.POSICION_ANTERIOR_EN_VEHICULO}</span>
            </span>
            <ArrowRight className="size-3 shrink-0 text-gray-400" />
            <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-slate-200">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{neu.POSICION_NUEVA_EN_VEHICULO}</span>
            </span>
          </div>
        ) : posDisplay ? (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
            <MapPin className="size-3 shrink-0" />
            {posDisplay}
          </span>
        ) : null}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {neu.KM_RECORRIDOS_EN_ETAPA !== null && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
              <Route className="size-3" />
              {neu.KM_RECORRIDOS_EN_ETAPA} km
            </span>
          )}
          {neu.REMANENTE_MEDIDO_MM !== null && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
              <Gauge className="size-3" />
              {neu.REMANENTE_MEDIDO_MM} mm
            </span>
          )}
          {neu.PRESION_AIRE_PSI !== null && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
              <Wind className="size-3" />
              {neu.PRESION_AIRE_PSI} PSI
            </span>
          )}
          {neu.TORQUE_APLICADO_NM !== null && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
              <Wrench className="size-3" />
              {neu.TORQUE_APLICADO_NM} nm
            </span>
          )}
          {neu.PORCENTAJE_VIDA_UTIL !== null && (
            <span className={cn(
              'text-xs font-semibold rounded-full px-1.5',
              neu.PORCENTAJE_VIDA_UTIL < 39 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300' :
                neu.PORCENTAJE_VIDA_UTIL < 79 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300' :
                  'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-300'
            )}>
              {neu.PORCENTAJE_VIDA_UTIL}%
            </span>
          )}
        </div>
      </div>
      {obs && (
        <div className="flex items-start gap-1 text-xs text-gray-400 pl-1">
          <MessageSquare className="size-3 shrink-0 mt-px" />
          <span className="italic">{obs}</span>
        </div>
      )}
    </div>
  )
}

export const PlacaTimelineEventCard = ({ mov, isLast }: { mov: MovimientoAgrupado; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const accent = timelineCardAccent(mov.ID_ACCION_REALIZADA)
  const accionLabel = mov.ACCION_REALIZADA
    ? `${mov.ACCION_REALIZADA.charAt(0).toUpperCase()}${mov.ACCION_REALIZADA.slice(1).toLowerCase()}`
    : ''
  const fechaDisplay = mov.FECHA_MOVIMIENTO

  return (
    <div className="relative flex gap-4">
      {/* Icon + connector */}
      <div className="flex flex-col items-center shrink-0 w-10">
        <div className={cn('size-10 rounded-xl border-2 flex items-center justify-center shadow-sm z-10 bg-white dark:bg-card', timelineIconBg(mov.ID_ACCION_REALIZADA))}>
          {timelineIcon(mov.ID_ACCION_REALIZADA)}
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-1 rounded-full bg-linear-to-b', timelineLineColor(mov.ID_ACCION_REALIZADA))} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all">
          <div className={cn('w-1.5 shrink-0', accent.stripe)} />

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn('flex-1 min-w-0 text-left bg-white dark:bg-card transition-all cursor-pointer', expanded && 'shadow-md')}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <span className={cn('px-3 py-0.5 rounded-md font-medium text-xs', accent.badge)}>
                  {accionLabel}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {fechaDisplay ? convertToDateHuman(fechaDisplay) : 'Sin fecha'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!expanded && (
                  <span className={cn('hidden sm:inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5', accent.chip)}>
                    <CircleDot className="size-3" />
                    {mov.NEUMATICOS.length} neumático{mov.NEUMATICOS.length !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronDown className={cn('size-4 text-gray-300 transition-transform duration-200', expanded && 'rotate-180 text-gray-500 dark:text-slate-400')} />
              </div>
            </div>

            {/* Expanded */}
            {expanded && (
              <div className="px-3.5 pb-3.5 border-t border-gray-50">
                {/* Meta row */}
                <div className="flex flex-wrap gap-3 mt-3 mb-3">

                  {mov.KILOMETRAJE && (
                    <div className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-300">
                      <Gauge className="size-3" />
                      <span>{Number(mov.KILOMETRAJE).toLocaleString('es-PE')} km</span>
                    </div>
                  )}
                  {mov.TERRENO && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Mountain className="size-3" />
                      <span>{mov.TERRENO}</span>
                    </div>
                  )}
                  {mov.CONDICION && (
                    <div className="flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-300">
                      <Activity className="size-3" />
                      <span>{mov.CONDICION}</span>
                    </div>
                  )}
                  {mov.TALLER_ASIGNADO && (
                    <div className="flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-300">
                      <Building2 className="size-3" />
                      <span>{mov.TALLER_ASIGNADO}</span>
                    </div>
                  )}
                  {mov.USUARIO_REGISTRADOR?.trim() && (
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-superficie-2 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300">
                      <User className="size-3" />
                      <span>{mov.USUARIO_REGISTRADOR.trim()}</span>
                    </div>
                  )}
                </div>

                {/* Tire list */}
                <div className="space-y-1.5">
                  {mov.NEUMATICOS.map((neu) => (
                    <NeuRow key={`${neu.CODIGO_NEUMATICO}-${neu.ID_MOVIMIENTO}`} neu={neu} tipo={mov.ID_ACCION_REALIZADA} />
                  ))}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
