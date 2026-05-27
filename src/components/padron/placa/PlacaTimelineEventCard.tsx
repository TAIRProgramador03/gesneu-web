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
    case 2: return 'bg-green-100 text-green-600 border-green-200'
    case 4: return 'bg-indigo-100 text-indigo-600 border-indigo-200'
    case 5: return 'bg-red-100 text-red-600 border-red-200'
    case 6: return 'bg-cyan-100 text-cyan-600 border-cyan-200'
    case 7: return 'bg-amber-100 text-amber-600 border-amber-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
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
    case 2: return 'from-green-300 to-green-100'
    case 4: return 'from-indigo-300 to-indigo-100'
    case 5: return 'from-red-300 to-red-100'
    case 6: return 'from-cyan-300 to-cyan-100'
    case 7: return 'from-amber-300 to-amber-100'
    default: return 'from-gray-300 to-gray-100'
  }
}

function timelineCardAccent(tipo: number) {
  const base: Record<number, { stripe: string; ring: string; chip: string; badge: string }> = {
    2: { stripe: 'bg-green-400', ring: 'ring-green-100 border-green-200', chip: 'bg-green-50 text-green-700', badge: 'bg-green-100 text-green-700' },
    4: { stripe: 'bg-indigo-400', ring: 'ring-indigo-100 border-indigo-200', chip: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    5: { stripe: 'bg-red-400', ring: 'ring-red-100 border-red-200', chip: 'bg-red-50 text-red-700', badge: 'bg-red-100 text-red-700' },
    6: { stripe: 'bg-cyan-400', ring: 'ring-cyan-100 border-cyan-200', chip: 'bg-cyan-50 text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
    7: { stripe: 'bg-amber-400', ring: 'ring-amber-100 border-amber-200', chip: 'bg-amber-50 text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  }
  return base[tipo] ?? { stripe: 'bg-gray-400', ring: 'ring-gray-100 border-gray-200', chip: 'bg-gray-50 text-gray-700', badge: 'bg-gray-100 text-gray-700' }
}

function NeuRow({ neu, tipo }: { neu: NeumaticoDelHistorial; tipo: number }) {
  const accent = timelineCardAccent(tipo)
  const obs = neu.OBSERVACION?.trim()
  const posDisplay = neu.POSICION_NUEVA_EN_VEHICULO ?? neu.POSICION_ANTERIOR_EN_VEHICULO

  return (
    <div className="rounded-lg bg-gray-50 p-2.5 space-y-1.5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className={cn('text-[11px] font-bold rounded px-2 py-0.5 shrink-0', accent.badge)}>
          {neu.CODIGO_NEUMATICO}
        </span>
        {tipo === 4 && neu.POSICION_ANTERIOR_EN_VEHICULO && neu.POSICION_NUEVA_EN_VEHICULO ? (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 min-w-0">
            <span className="flex items-center gap-1 text-gray-400">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{neu.POSICION_ANTERIOR_EN_VEHICULO}</span>
            </span>
            <ArrowRight className="size-3 shrink-0 text-gray-400" />
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{neu.POSICION_NUEVA_EN_VEHICULO}</span>
            </span>
          </div>
        ) : posDisplay ? (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="size-3 shrink-0" />
            {posDisplay}
          </span>
        ) : null}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {neu.KM_RECORRIDOS_EN_ETAPA !== null && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Route className="size-3" />
              {neu.KM_RECORRIDOS_EN_ETAPA} km
            </span>
          )}
          {neu.REMANENTE_MEDIDO_MM !== null && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Gauge className="size-3" />
              {neu.REMANENTE_MEDIDO_MM} mm
            </span>
          )}
          {neu.PRESION_AIRE_PSI !== null && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Wind className="size-3" />
              {neu.PRESION_AIRE_PSI} PSI
            </span>
          )}
          {neu.TORQUE_APLICADO_NM !== null && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Wrench className="size-3" />
              {neu.TORQUE_APLICADO_NM} nm
            </span>
          )}
          {neu.PORCENTAJE_VIDA_UTIL !== null && (
            <span className={cn(
              'text-[10px] font-semibold rounded-full px-1.5',
              neu.PORCENTAJE_VIDA_UTIL < 39 ? 'bg-red-50 text-red-600' :
                neu.PORCENTAJE_VIDA_UTIL < 79 ? 'bg-amber-50 text-amber-600' :
                  'bg-green-50 text-green-600'
            )}>
              {neu.PORCENTAJE_VIDA_UTIL}%
            </span>
          )}
        </div>
      </div>
      {obs && (
        <div className="flex items-start gap-1 text-[10px] text-gray-400 pl-1">
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
        <div className={cn('size-10 rounded-xl border-2 flex items-center justify-center shadow-sm z-10 bg-white', timelineIconBg(mov.ID_ACCION_REALIZADA))}>
          {timelineIcon(mov.ID_ACCION_REALIZADA)}
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-1 rounded-full bg-linear-to-b', timelineLineColor(mov.ID_ACCION_REALIZADA))} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
          <div className={cn('w-1.5 shrink-0', accent.stripe)} />

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn('flex-1 min-w-0 text-left bg-white transition-all cursor-pointer', expanded && 'shadow-md')}
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
                  <span className={cn('hidden sm:inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5', accent.chip)}>
                    <CircleDot className="size-3" />
                    {mov.NEUMATICOS.length} neumático{mov.NEUMATICOS.length !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronDown className={cn('size-4 text-gray-300 transition-transform duration-200', expanded && 'rotate-180 text-gray-500')} />
              </div>
            </div>

            {/* Expanded */}
            {expanded && (
              <div className="px-3.5 pb-3.5 border-t border-gray-50">
                {/* Meta row */}
                <div className="flex flex-wrap gap-3 mt-3 mb-3">

                  {mov.KILOMETRAJE && (
                    <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                      <Gauge className="size-3" />
                      <span>{Number(mov.KILOMETRAJE).toLocaleString('es-PE')} km</span>
                    </div>
                  )}
                  {mov.TERRENO && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <Mountain className="size-3" />
                      <span>{mov.TERRENO}</span>
                    </div>
                  )}
                  {mov.CONDICION && (
                    <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
                      <Activity className="size-3" />
                      <span>{mov.CONDICION}</span>
                    </div>
                  )}
                  {mov.TALLER_ASIGNADO && (
                    <div className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600">
                      <Building2 className="size-3" />
                      <span>{mov.TALLER_ASIGNADO}</span>
                    </div>
                  )}
                  {mov.USUARIO_REGISTRADOR?.trim() && (
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
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
