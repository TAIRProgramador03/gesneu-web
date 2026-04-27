'use client'

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useNeumaticoDetail, type MovimientoHistorial } from "@/hooks/use-neumatico-detail"
import { TipoMovimientoBadge } from "@/components/ui/TipoMovimientoBadge"
import { DataTableNeumaticos } from "@/components/ui/data-table/data-table"
import { Spinner } from "@/components/ui/spinner"
import { cn, convertToDateHuman } from "@/lib/utils"
import { columnsHistorial } from "./columns-historial"
import type { NeumaticoBuscado } from "@/api/Neumaticos"
import {
  Gauge,
  Route,
  ClipboardList,
  ArrowRightLeft,
  ChevronDown,
  FileText,
  Activity,
  Clock,
  TrendingDown,
  Calendar,
  Zap,
  Truck,
  PackageMinus,
  RefreshCw,
  Search,
  PackagePlus,
  CircleDot,
  MapPin,
  User,
  Wrench,
  Wind,
  BarChart3,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts"
import { HeroHeader } from "@/components/padron/neumatico/HeroHeader"
import { vidaBgBar, vidaColor } from "@/utils/helpers"
import { CustomBreadcrumb } from "@/components/ui/CustomBreadcrumb"
import { StatCard } from "@/components/padron/neumatico/StatCard"
import { FichaTecnica } from "@/components/padron/neumatico/FichaTecnica"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"
import { VidaUtilCard } from "@/components/padron/neumatico/VidaUtilCard"
import { RemanenteChart } from "@/components/padron/neumatico/RemanenteChart"

// ─── Helpers ────────────────────────────────────────────────────────────────

function vidaBgGradient(pct: number) {
  if (pct >= 60) return "from-teal-500 to-emerald-400"
  if (pct >= 30) return "from-yellow-500 to-amber-400"
  return "from-red-500 to-rose-400"
}

function vidaRingColor(pct: number) {
  if (pct >= 60) return "stroke-teal-500"
  if (pct >= 30) return "stroke-yellow-500"
  return "stroke-red-500"
}

function vidaTrackColor(pct: number) {
  if (pct >= 60) return "stroke-teal-100"
  if (pct >= 30) return "stroke-yellow-100"
  return "stroke-red-100"
}

function timelineDotColor(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-500"
    case "DISPONIBLE": return "bg-sky-500"
    case "BAJA": return "bg-red-500"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-500"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-yellow-500"
    case "REGISTRO": return "bg-gray-400"
    default: return "bg-gray-400"
  }
}

function timelineIconBg(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "bg-green-100 text-green-600 border-green-200"
    case "DISPONIBLE": return "bg-sky-100 text-sky-600 border-sky-200"
    case "BAJA": return "bg-red-100 text-red-600 border-red-200"
    case "ROTACIÓN":
    case "ROTACION": return "bg-indigo-100 text-indigo-600 border-indigo-200"
    case "INSPECCIÓN":
    case "INSPECCION": return "bg-amber-100 text-amber-600 border-amber-200"
    case "REGISTRO": return "bg-gray-100 text-gray-500 border-gray-200"
    default: return "bg-gray-100 text-gray-500 border-gray-200"
  }
}

function timelineIcon(tipo: string) {
  const cls = "size-4"
  switch (tipo) {
    case "ASIGNADO": return <Truck className={cls} />
    case "DISPONIBLE": return <PackagePlus className={cls} />
    case "BAJA": return <PackageMinus className={cls} />
    case "ROTACIÓN":
    case "ROTACION": return <RefreshCw className={cls} />
    case "INSPECCIÓN":
    case "INSPECCION": return <Search className={cls} />
    case "REGISTRO": return <CircleDot className={cls} />
    default: return <CircleDot className={cls} />
  }
}

function timelineLineColor(tipo: string) {
  switch (tipo) {
    case "ASIGNADO": return "from-green-300 to-green-100"
    case "DISPONIBLE": return "from-sky-300 to-sky-100"
    case "BAJA": return "from-red-300 to-red-100"
    case "ROTACIÓN":
    case "ROTACION": return "from-indigo-300 to-indigo-100"
    case "INSPECCIÓN":
    case "INSPECCION RUTINARIA": return "from-amber-300 to-amber-100"
    default: return "from-gray-300 to-gray-100"
  }
}

/** Color accents per movement type */
function timelineCardAccent(tipo: string) {
  const base: Record<string, { stripe: string; ring: string; chip: string }> = {
    ASIGNADO: { stripe: "bg-green-400", ring: "ring-green-100 border-green-200", chip: "bg-green-50 text-green-600" },
    DISPONIBLE: { stripe: "bg-sky-400", ring: "ring-sky-100 border-sky-200", chip: "bg-sky-50 text-sky-600" },
    BAJA: { stripe: "bg-red-400", ring: "ring-red-100 border-red-200", chip: "bg-red-50 text-red-600" },
    ROTACIÓN: { stripe: "bg-indigo-400", ring: "ring-indigo-100 border-indigo-200", chip: "bg-indigo-50 text-indigo-600" },
    ROTACION: { stripe: "bg-indigo-400", ring: "ring-indigo-100 border-indigo-200", chip: "bg-indigo-50 text-indigo-600" },
    INSPECCIÓN: { stripe: "bg-amber-400", ring: "ring-amber-100 border-amber-200", chip: "bg-amber-50 text-amber-600" },
    "INSPECCION RUTINARIA": { stripe: "bg-amber-400", ring: "ring-amber-100 border-amber-200", chip: "bg-amber-50 text-amber-600" },
    REGISTRO: { stripe: "bg-gray-300", ring: "ring-gray-100 border-gray-200", chip: "bg-gray-50 text-gray-500" },
    TEMPORAL: { stripe: "bg-cyan-400", ring: "ring-cyan-100 border-cyan-200", chip: "bg-cyan-50 text-cyan-600" },
    REQUERIDO: { stripe: "bg-rose-400", ring: "ring-rose-100 border-rose-200", chip: "bg-rose-50 text-rose-600" },
  }
  return base[tipo] ?? base.REGISTRO
}



// ─── Timeline detail item (dato label+value) ───────────────────────────────

function DetailChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 leading-none">{label}</p>
        <p className="text-xs font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Single Timeline Event Card ─────────────────────────────────────────────

function TimelineEventCard({ mov, isLast }: { mov: MovimientoHistorial; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const accent = timelineCardAccent(mov.ACCION_REALIZADA)

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
            "size-10 rounded-xl border-2 flex items-center justify-center shadow-sm z-10 bg-white",
            timelineIconBg(mov.ACCION_REALIZADA)
          )}
        >
          {timelineIcon(mov.ACCION_REALIZADA)}
        </div>
        {!isLast && (
          <div className={cn("w-0.5 flex-1 mt-1 rounded-full bg-linear-to-b", timelineLineColor(mov.ACCION_REALIZADA))} />
        )}
      </div>

      {/* Right column: card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
          {/* Color stripe — visible from outside */}
          <div className={cn("w-1.5 shrink-0", accent.stripe)} />

          <button
            type="button"
            onClick={() => hasDetails && setExpanded(!expanded)}
            className={cn(
              "flex-1 min-w-0 text-left bg-white transition-all",
              expanded ? cn("shadow-md") : "",
              hasDetails && "cursor-pointer"
            )}
          >
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <TipoMovimientoBadge tipoMovimiento={mov.ACCION_REALIZADA} />
                <span className="text-xs text-gray-400 shrink-0">
                  {convertToDateHuman(mov.FECHA_INSPECCION)}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Quick preview chips — tinted per type */}
                {!expanded && mov.PLACA_VEHICULO && (
                  <span className={cn("hidden sm:inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5", accent.chip)}>
                    <Truck className="size-3" />
                    {mov.PLACA_VEHICULO}
                  </span>
                )}
                {!expanded && mov.REMANENTE_MEDIDO_MM !== null && (
                  <span className={cn("hidden sm:inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5", accent.chip)}>
                    <Gauge className="size-3" />
                    {mov.REMANENTE_MEDIDO_MM} mm
                  </span>
                )}
                {hasDetails && (
                  <ChevronDown
                    className={cn(
                      "size-4 text-gray-300 transition-transform duration-200",
                      expanded && "rotate-180 text-gray-500"
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
                  <div className="mt-3 rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-0.5">Observación</p>
                    <p className="text-xs text-amber-800">{mov.OBSERVACION}</p>
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

// ─── Timeline (rediseñada) ──────────────────────────────────────────────────

function Timeline({ movimientos }: { movimientos: MovimientoHistorial[] }) {
  const [showAll, setShowAll] = useState(false)

  if (movimientos.length === 0) {
    return (
      <CollapsibleSection title="Línea de Tiempo" icon={<Clock className="size-4" />}>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="rounded-2xl bg-gray-50 p-5 mb-4">
            <Clock className="size-10 opacity-30" />
          </div>
          <p className="text-sm font-medium text-gray-400">Sin movimientos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Los movimientos aparecerán aquí a medida que se registren.</p>
        </div>
      </CollapsibleSection>
    )
  }

  const visible = showAll ? movimientos : movimientos.slice(0, 6)

  return (
    <CollapsibleSection
      title="Línea de Tiempo"
      icon={<Clock className="size-4" />}
      headerRight={
        <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
          {movimientos.length} eventos
        </span>
      }
    >
      <div>
        {visible.map((mov, idx) => (
          <TimelineEventCard
            key={`${mov.CODIGO_NEUMATICO}-${mov.FECHA_INSPECCION}-${idx}`}
            mov={mov}
            isLast={idx === visible.length - 1}
          />
        ))}

        {movimientos.length > 6 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-full px-5 py-2 transition-colors"
            >
              {showAll ? (
                <>Mostrar menos</>
              ) : (
                <>Ver los {movimientos.length} eventos</>
              )}
              <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function NeumaticoDashboard({ codigo }: { codigo: string }) {
  const { neumatico, historial, isLoading, isError } = useNeumaticoDetail({ codigo })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="size-8 text-sky-800" />
      </div>
    )
  }

  if (isError || !neumatico) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-500">No se encontró el neumático con código <strong>{codigo}</strong>.</p>
        <Link href="/padron" className="text-sky-800 hover:underline text-sm">
          Volver al padrón
        </Link>
      </div>
    )
  }

  const pctVida = neumatico.PORCENTAJE_VIDA ?? 0
  const totalInspecciones = historial.filter(movimiento => movimiento.ACCION_REALIZADA === "INSPECCION RUTINARIA").length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <CustomBreadcrumb codigo={codigo} />

      {/* Hero */}
      <HeroHeader neu={neumatico} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Gauge className="size-5" />}
          label="Vida útil"
          value={`${pctVida}%`}
          color={vidaColor(pctVida)}
        />
        <StatCard
          icon={<Route className="size-5" />}
          label="Remanente actual"
          value={`${neumatico.REMANENTE_ACTUAL} mm`}
          color="text-sky-800"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Total inspecciones"
          value={totalInspecciones}
          color="text-indigo-600"
        />
        <StatCard
          icon={<ArrowRightLeft className="size-5" />}
          label="Total movimientos"
          value={historial.length}
          color="text-teal-600"
        />
      </div>

      {/* Mid row: Ficha Técnica + Vida Útil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <FichaTecnica neu={neumatico} />
        <VidaUtilCard neu={neumatico} historial={historial} />
      </div>

      {/* Remanente Chart */}
      <RemanenteChart historial={historial} neu={neumatico} />

      {/* Timeline */}
      <Timeline movimientos={historial} />

      {/* Historial Table */}
      <CollapsibleSection title="Historial de Movimientos" icon={<ClipboardList className="size-4" />}>
        <DataTableNeumaticos
          columns={columnsHistorial}
          data={historial}
          type="pagination"
          filters
          withExport
          exportConfig={{ title: `Historial_${codigo}` }}
        />
      </CollapsibleSection>
    </div>
  )
}
