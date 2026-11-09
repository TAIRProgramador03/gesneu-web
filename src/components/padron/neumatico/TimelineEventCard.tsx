import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge';
import { MovimientoHistorial } from '@/hooks/use-neumatico-detail';
import { cn, convertToDateHuman } from '@/lib/utils';
import { Activity, ChevronDown, CircleDot, FileText, Gauge, MapPin, PackageMinus, PackagePlus, Recycle, RefreshCw, Route, Search, Truck, User, Wind, Wrench } from 'lucide-react';
import React, { useState } from 'react'

function timelineIconBg(tipo: number) {
  switch (tipo) {
    case 2: return "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-300 border-green-200 dark:border-green-500/30"
    case 4: return "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
    case 5: return "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30"
    case 6: return "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30"
    case 7: return "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
    default: return "bg-gray-100 dark:bg-superficie-2 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
  }
}

function timelineIcon(tipo: number) {
  const cls = "size-4"
  switch (tipo) {
    case 2: return <Truck className={cls} />
    case 4: return <RefreshCw className={cls} />
    case 5: return <PackageMinus className={cls} />
    case 6: return <Recycle className={cls} /> // * falta  
    case 7: return <Search className={cls} />
    default: return <CircleDot className={cls} />
  }
}

function timelineLineColor(tipo: number) {
  switch (tipo) {
    case 2: return "from-green-300 to-green-100 dark:to-green-500/15"
    case 4: return "from-indigo-300 to-indigo-100 dark:to-indigo-500/15"
    case 5: return "from-red-300 to-red-100 dark:to-red-500/15"
    case 6: return "from-cyan-300 to-cyan-100 dark:to-cyan-500/15"
    case 7: return "from-amber-300 to-amber-100 dark:to-amber-500/15"
    default: return "from-gray-300 to-gray-100 dark:to-superficie-2"
  }
}

function timelineCardAccent(tipo: number) {
  const base: Record<string, { stripe: string; ring: string; chip: string }> = {
    2: { stripe: "bg-green-400", ring: "ring-green-100 dark:ring-green-500/20 border-green-200 dark:border-green-500/30", chip: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-300" },
    4: { stripe: "bg-indigo-400", ring: "ring-indigo-100 dark:ring-indigo-500/20 border-indigo-200 dark:border-indigo-500/30", chip: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" },
    5: { stripe: "bg-red-400", ring: "ring-red-100 dark:ring-red-500/20 border-red-200 dark:border-red-500/30", chip: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300" },
    6: { stripe: "bg-cyan-400", ring: "ring-cyan-100 dark:ring-cyan-500/20 border-cyan-200 dark:border-cyan-500/30", chip: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
    7: { stripe: "bg-amber-400", ring: "ring-amber-100 dark:ring-amber-500/20 border-amber-200 dark:border-amber-500/30", chip: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  }
  return base[tipo] ?? base.REGISTRO
}

function DetailChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-superficie-1 px-3 py-2">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-gray-400 leading-none">{label}</p>
        <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  )
}

const TipoMovimientoBadgeNew = ({ tipo = 0, text = '' }: { tipo: number, text: string }) => {
  return (
    <span className={`px-6 py-0.5 rounded-md  font-medium text-xs ${tipo === 2 ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' :
      tipo === 4 ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' :
        tipo === 5 ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
          tipo === 6 ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' :
            tipo === 7 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
              'bg-gray-100 dark:bg-superficie-2 text-gray-700 dark:text-slate-200'
      }`}>
      {
        tipo
          ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : ''
      }
    </span>
  )
}

export const TimelineEventCard = ({ mov, isLast }: { mov: MovimientoHistorial; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const accent = timelineCardAccent(mov.ID_ACCION_REALIZADA)

  const hasDetails =
    mov.PRESION_AIRE_PSI !== null ||
    mov.TORQUE_APLICADO_NM !== null ||
    mov.POSICION_ANTERIOR_EN_VEHICULO ||
    mov.USUARIO_REGISTRADOR ||
    mov.OBSERVACION ||
    mov.KM_RECORRIDOS_EN_ETAPA !== null

  return (
    <div className="relative flex gap-4">
      {/* Left column: icon + connector */}
      <div className="flex flex-col items-center shrink-0 w-10">
        <div
          className={cn(
            "size-10 rounded-xl border-2 flex items-center justify-center shadow-sm z-10 bg-white dark:bg-card",
            timelineIconBg(mov.ID_ACCION_REALIZADA)
          )}
        >
          {timelineIcon(mov.ID_ACCION_REALIZADA)}
        </div>
        {!isLast && (
          <div className={cn("w-0.5 flex-1 mt-1 rounded-full bg-linear-to-b", timelineLineColor(mov.ID_ACCION_REALIZADA))} />
        )}
      </div>

      {/* Right column: card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all">
          {/* Color stripe — visible from outside */}
          <div className={cn("w-1.5 shrink-0", accent.stripe)} />

          <button
            type="button"
            onClick={() => hasDetails && setExpanded(!expanded)}
            className={cn(
              "flex-1 min-w-0 text-left bg-white dark:bg-card transition-all",
              expanded ? cn("shadow-md") : "",
              hasDetails && "cursor-pointer"
            )}
          >
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <TipoMovimientoBadgeNew tipo={mov.ID_ACCION_REALIZADA} text={mov.ACCION_REALIZADA} />
                <span className="text-xs text-gray-400 shrink-0">
                  {convertToDateHuman(mov.FECHA_MOVIMIENTO)}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Quick preview chips — tinted per type */}
                {!expanded && mov.PLACA_VEHICULO && (
                  <span className={cn("hidden sm:inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5", accent.chip)}>
                    <Truck className="size-3" />
                    {mov.PLACA_VEHICULO}
                  </span>
                )}
                {!expanded && mov.REMANENTE_MEDIDO_MM !== null && (
                  <span className={cn("hidden sm:inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5", accent.chip)}>
                    <Gauge className="size-3" />
                    {mov.REMANENTE_MEDIDO_MM} mm
                  </span>
                )}
                {hasDetails && (
                  <ChevronDown
                    className={cn(
                      "size-4 text-gray-300 transition-transform duration-200",
                      expanded && "rotate-180 text-gray-500 dark:text-slate-400"
                    )}
                  />
                )}
              </div>
            </div>

            {/* Expanded detail grid */}
            {expanded && (
              <div className="px-3.5 pl-4 pb-3.5 border-t border-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {mov.PLACA_VEHICULO && (
                    <DetailChip icon={<Truck className="size-3.5" />} label="Placa" value={mov.PLACA_VEHICULO} />
                  )}
                  {mov.POSICION_NUEVA_EN_VEHICULO && (
                    <DetailChip icon={<MapPin className="size-3.5" />} label="Posición nueva" value={mov.POSICION_NUEVA_EN_VEHICULO} />
                  )}
                  {mov.POSICION_ANTERIOR_EN_VEHICULO && (
                    <DetailChip icon={<MapPin className="size-3.5" />} label="Posición anterior" value={mov.POSICION_ANTERIOR_EN_VEHICULO} />
                  )}
                  {mov.REMANENTE_MEDIDO_MM !== null && (
                    <DetailChip icon={<Gauge className="size-3.5" />} label="Remanente" value={`${mov.REMANENTE_MEDIDO_MM} mm`} />
                  )}
                  {mov.PORCENTAJE_VIDA_UTIL !== null && (
                    <DetailChip icon={<Activity className="size-3.5" />} label="Vida útil" value={`${mov.PORCENTAJE_VIDA_UTIL}%`} />
                  )}
                  {mov.KM_RECORRIDOS_EN_ETAPA !== null && (
                    <DetailChip icon={<Route className="size-3.5" />} label="Km en etapa" value={mov.KM_RECORRIDOS_EN_ETAPA.toLocaleString("es-PE")} />
                  )}
                  {mov.PRESION_AIRE_PSI !== null && (
                    <DetailChip icon={<Wind className="size-3.5" />} label="Presión aire" value={`${mov.PRESION_AIRE_PSI} PSI`} />
                  )}
                  {mov.TORQUE_APLICADO_NM !== null && (
                    <DetailChip icon={<Wrench className="size-3.5" />} label="Torque" value={`${mov.TORQUE_APLICADO_NM} Nm`} />
                  )}
                  {mov.TALLER_ASIGNADO && (
                    <DetailChip icon={<FileText className="size-3.5" />} label="Taller" value={mov.TALLER_ASIGNADO} />
                  )}
                  {mov.USUARIO_REGISTRADOR && (
                    <DetailChip icon={<User className="size-3.5" />} label="Registrado por" value={mov.USUARIO_REGISTRADOR} />
                  )}
                </div>
                {mov.OBSERVACION && (
                  <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-500/10/60 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-2">
                    <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-0.5">Observación</p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">{mov.OBSERVACION}</p>
                  </div>
                )}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
