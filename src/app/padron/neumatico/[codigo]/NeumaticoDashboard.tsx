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

// ─── Collapsible Section ────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  headerRight,
  children,
}: {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl bg-white shadow-sm border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between p-5 transition-colors",
          open ? "hover:bg-gray-50/50" : "hover:bg-gray-50/50 rounded-2xl"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-50 text-sky-700 p-2">
            {icon}
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerRight}
          <ChevronDown
            className={cn(
              "size-5 text-gray-400 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Ficha Técnica (mejorada) ───────────────────────────────────────────────

function FichaItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="group relative rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-3 hover:border-sky-200 hover:shadow-sm transition-all">
      <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </span>
      <span
        className={cn(
          "block text-sm font-medium leading-snug break-words",
          accent ? "text-sky-700" : "text-gray-800"
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

function FichaTecnica({ neu }: { neu: NeumaticoBuscado }) {
  const sections: { title: string; cols?: string; items: { label: string; value: string; accent?: boolean }[] }[] = [
    {
      title: "Identificación",
      items: [
        { label: "Código", value: neu.CODIGO_NEUMATICO || "—", accent: true },
        { label: "Marca", value: neu.MARCA_NEUMATICO || "—" },
        { label: "Medida", value: neu.MEDIDA_NEUMATICO || "—" },
        { label: "Diseño", value: neu.DISENO_NEUMATICO || "—" },
        { label: "PR", value: neu.PR_NEUMATICO || "—" },
      ],
    },
    {
      title: "Compra / Logística",
      cols: "grid-cols-1 sm:grid-cols-2",
      items: [
        { label: "Proveedor", value: neu.PROVEEDOR_NEUMATICO || "—" },
        { label: "RUC Proveedor", value: neu.RUC_PROVEEDOR_NEUMATICO || "—" },
        { label: "Costo", value: neu.COSTO_NEUMATICO !== null ? `$ ${neu.COSTO_NEUMATICO.toLocaleString("es-PE")}` : "—", accent: true },
        { label: "Fecha fabricación", value: neu.FECHA_FABRIACACION ? convertToDateHuman(neu.FECHA_FABRIACACION) : "—" },
        { label: "RQ", value: neu.RQ_NEUMATICO || "—" },
        { label: "OC", value: neu.OC_NEUMATICO || "—" },
        { label: "Leasing", value: neu.LEASING_NEUMATICO || "—" },
      ],
    },
    {
      title: "Ubicación / Estado",
      items: [
        { label: "Taller inicial", value: neu.TALLER_INICIAL || "—" },
        { label: "Taller actual", value: neu.TALLER_ACTUAL || "—" },
        { label: "Placa actual", value: neu.PLACA_ACTUAL || "—", accent: true },
        { label: "Situación", value: neu.SITUACION_NEUMATICO || "—" },
        { label: "Recuperado", value: neu.RECUPERADO_NEUMATICO ? "Sí" : "No" },
      ],
    },
    {
      title: "Remanente",
      cols: "grid-cols-3",
      items: [
        { label: "Original", value: neu.REMANENTE_ORIGINAL !== null ? `${neu.REMANENTE_ORIGINAL} mm` : "—" },
        { label: "Montado", value: neu.REMANENTE_MONTADO !== null ? `${neu.REMANENTE_MONTADO} mm` : "—" },
        { label: "Actual", value: neu.REMANENTE_ACTUAL !== null ? `${neu.REMANENTE_ACTUAL} mm` : "—", accent: true },
      ],
    },
  ]

  return (
    <CollapsibleSection title="Ficha Técnica" icon={<FileText className="size-4" />}>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                {section.title}
              </h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className={cn("grid gap-2.5", section.cols || "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5")}>
              {section.items.map((item) => (
                <FichaItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

// ─── Vida Útil (rediseñada) ──────────────────────────────────────────────────

function SemiGauge({ pct }: { pct: number }) {
  const radius = 80
  const stroke = 12
  const r = radius - stroke / 2
  // Semicircle = half circumference
  const halfCirc = r * Math.PI
  const offset = halfCirc - (Math.min(pct, 100) / 100) * halfCirc

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={radius * 2}
        height={radius + 8}
        viewBox={`0 0 ${radius * 2} ${radius + 8}`}
      >
        {/* Track (semicircle) */}
        <path
          d={`M ${stroke / 2},${radius} A ${r},${r} 0 0,1 ${radius * 2 - stroke / 2},${radius}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={vidaTrackColor(pct)}
        />
        {/* Progress */}
        <path
          d={`M ${stroke / 2},${radius} A ${r},${r} 0 0,1 ${radius * 2 - stroke / 2},${radius}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          className={cn(vidaRingColor(pct), "transition-all duration-700 ease-out")}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className={cn("text-4xl font-extrabold leading-none", vidaColor(pct))}>
          {pct}<span className="text-lg">%</span>
        </span>
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-semibold mt-1.5",
          pct >= 60 ? "bg-teal-50 text-teal-700" :
            pct >= 30 ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
        )}>
          <span className={cn("size-1.5 rounded-full", vidaBgBar(pct))} />
          {pct >= 60 ? "Buen estado" : pct >= 30 ? "Desgaste moderado" : "Desgaste crítico"}
        </div>
      </div>
    </div>
  )
}

function MiniKpi({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-3 flex items-start gap-3 hover:border-sky-200 hover:shadow-sm transition-all">
      <div className={cn("rounded-lg p-2 shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
          {label}
        </p>
        <p className="text-base font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null

  const h = 48
  const w = 200
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const pad = 4

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (w - pad * 2),
    y: pad + ((max - v) / range) * (h - pad * 2),
  }))

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ")
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${h} L ${coords[0].x},${h} Z`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={color} stopOpacity="0.15" />
          <stop offset="100%" className={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${color})`} />
      <path d={linePath} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color.replace("stop-", "stroke-")} />
      {/* Last point dot */}
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="3"
        className={cn(color.replace("stop-", "fill-"))}
      />
    </svg>
  )
}

function ComparisonBar({ neu }: { neu: NeumaticoBuscado }) {
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const montado = neu.REMANENTE_MONTADO ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0
  const max = original || 1

  const items = [
    { label: "Original", value: original, pct: 100, barClass: "bg-gray-200" },
    { label: "Montado", value: montado, pct: (montado / max) * 100, barClass: "bg-gradient-to-r from-sky-400 to-sky-300" },
    { label: "Actual", value: actual, pct: (actual / max) * 100, barClass: cn("bg-gradient-to-r", vidaBgGradient(neu.PORCENTAJE_VIDA ?? 0)) },
  ]

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-16 shrink-0 text-right">
            {item.label}
          </span>
          <div className="flex-1 relative">
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", item.barClass)}
                style={{ width: `${Math.min(item.pct, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700 w-14 text-right tabular-nums">
            {item.value} mm
          </span>
        </div>
      ))}
    </div>
  )
}

function VidaUtilCard({ neu, historial }: { neu: NeumaticoBuscado; historial: MovimientoHistorial[] }) {
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0

  // Derived KPIs from historial
  const stats = useMemo(() => {
    const kmTotal = historial.reduce((acc, m) => acc + (m.KM_RECORRIDOS_EN_ETAPA ?? 0), 0)

    // Wear rate: mm desgastados / km recorridos (* 1000 for mm/1000km)
    const mmDesgastados = original - actual
    const tasaDesgaste = kmTotal > 0 ? (mmDesgastados / kmTotal) * 1000 : 0

    // Days in service: from earliest to latest date in historial
    let diasServicio = 0
    if (historial.length > 0) {
      const fechas = historial
        .map((m) => m.FECHA_INSPECCION || m.FECHA_REGISTRO_MOVIMIENTO)
        .filter(Boolean)
        .map((f) => new Date(f).getTime())
        .filter((t) => !isNaN(t))
      if (fechas.length > 0) {
        const earliest = Math.min(...fechas)
        const latest = Date.now()
        diasServicio = Math.max(0, Math.round((latest - earliest) / (1000 * 60 * 60 * 24)))
      }
    }

    // Sparkline points: remanente over time (chronological order)
    const remanenteSeries = [...historial]
      .filter((m) => m.REMANENTE_MEDIDO_MM != null && m.REMANENTE_MEDIDO_MM > 0)
      .reverse()
      .map((m) => m.REMANENTE_MEDIDO_MM)

    // ── Projection ──────────────────────────────────────────────
    // Minimum usable remanente threshold (mm)
    const REMANENTE_MINIMO = 3

    const mmRestantes = Math.max(0, actual - REMANENTE_MINIMO)

    // By km: how many km until hitting minimum
    const kmRestantes = tasaDesgaste > 0 ? (mmRestantes / tasaDesgaste) * 1000 : null

    // By time: mm consumed per day → days left
    const tasaDiaria = diasServicio > 0 ? mmDesgastados / diasServicio : 0
    const diasRestantes = tasaDiaria > 0 ? Math.round(mmRestantes / tasaDiaria) : null
    const fechaEstimada = diasRestantes != null
      ? new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000)
      : null

    return {
      kmTotal, tasaDesgaste, diasServicio, remanenteSeries, mmDesgastados,
      kmRestantes, diasRestantes, fechaEstimada, mmRestantes, REMANENTE_MINIMO,
    }
  }, [historial, original, actual])

  return (
    <CollapsibleSection title="Vida Útil" icon={<Activity className="size-4" />}>
      <div className="space-y-5">
        {/* Semicircular gauge */}
        <SemiGauge pct={pct} />

        {/* 3 Mini KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <MiniKpi
            icon={<Route className="size-3.5" />}
            label="Km recorridos"
            value={stats.kmTotal > 0 ? stats.kmTotal.toLocaleString("es-PE") : "—"}
            sub={stats.kmTotal > 0 ? "acumulados" : "sin datos"}
            color="bg-sky-50 text-sky-600"
          />
          <MiniKpi
            icon={<TrendingDown className="size-3.5" />}
            label="Tasa desgaste"
            value={stats.tasaDesgaste > 0 ? `${stats.tasaDesgaste.toFixed(2)}` : "—"}
            sub={stats.tasaDesgaste > 0 ? "mm / 1,000 km" : "sin datos"}
            color={cn(
              stats.tasaDesgaste === 0 ? "bg-gray-50 text-gray-500" :
                stats.tasaDesgaste <= 1 ? "bg-teal-50 text-teal-600" :
                  stats.tasaDesgaste <= 2.5 ? "bg-yellow-50 text-yellow-600" :
                    "bg-red-50 text-red-600"
            )}
          />
          <MiniKpi
            icon={<Calendar className="size-3.5" />}
            label="Días en servicio"
            value={stats.diasServicio > 0 ? `${stats.diasServicio}` : "—"}
            sub={stats.diasServicio > 0 ? `≈ ${Math.round(stats.diasServicio / 30)} meses` : "sin datos"}
            color="bg-indigo-50 text-indigo-600"
          />
        </div>

        {/* Comparison bar: Original vs Montado vs Actual */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
              Comparación remanente
            </h3>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <ComparisonBar neu={neu} />
          {stats.mmDesgastados > 0 && (
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Desgaste total: <strong className="text-gray-600">{stats.mmDesgastados.toFixed(1)} mm</strong> consumidos
            </p>
          )}
        </div>

        {/* Sparkline: tendencia de remanente */}
        {stats.remanenteSeries.length >= 2 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                Tendencia de desgaste
              </h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/40 p-4">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                <span>Primer registro</span>
                <span>Último registro</span>
              </div>
              <Sparkline
                points={stats.remanenteSeries}
                color={pct >= 60 ? "stop-teal-500" : pct >= 30 ? "stop-yellow-500" : "stop-red-500"}
              />
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="font-semibold text-gray-600">{stats.remanenteSeries[0]} mm</span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Zap className="size-3" />
                  {stats.remanenteSeries.length} mediciones
                </div>
                <span className={cn("font-semibold", vidaColor(pct))}>
                  {stats.remanenteSeries[stats.remanenteSeries.length - 1]} mm
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Projection: estimated remaining life */}
        {stats.diasRestantes != null && stats.diasRestantes > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                Proyección de vida restante
              </h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className={cn(
              "rounded-xl border p-4",
              stats.diasRestantes <= 30
                ? "border-red-200 bg-gradient-to-br from-red-50/50 to-white"
                : stats.diasRestantes <= 90
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"
                  : "border-teal-200 bg-gradient-to-br from-teal-50/50 to-white"
            )}>
              {/* Main projection */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "rounded-lg p-2 shrink-0",
                  stats.diasRestantes <= 30
                    ? "bg-red-100 text-red-600"
                    : stats.diasRestantes <= 90
                      ? "bg-amber-100 text-amber-600"
                      : "bg-teal-100 text-teal-600"
                )}>
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className={cn(
                    "text-lg font-bold leading-tight",
                    stats.diasRestantes <= 30
                      ? "text-red-700"
                      : stats.diasRestantes <= 90
                        ? "text-amber-700"
                        : "text-teal-700"
                  )}>
                    ~{stats.diasRestantes} días restantes
                  </p>
                  <p className="text-[10px] text-gray-400">
                    al ritmo actual de desgaste ({stats.mmRestantes.toFixed(1)} mm hasta el mínimo de {stats.REMANENTE_MINIMO} mm)
                  </p>
                </div>
              </div>

              {/* Sub projections */}
              <div className="grid grid-cols-2 gap-2">
                {stats.fechaEstimada && (
                  <div className="rounded-lg bg-white/80 border border-gray-100 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Fecha estimada</p>
                    <p className="text-xs font-semibold text-gray-800">
                      {stats.fechaEstimada.toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {stats.kmRestantes != null && (
                  <div className="rounded-lg bg-white/80 border border-gray-100 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Km restantes</p>
                    <p className="text-xs font-semibold text-gray-800">
                      ~{Math.round(stats.kmRestantes).toLocaleString("es-PE")} km
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

// ─── Remanente Chart ────────────────────────────────────────────────────────

interface ChartDataPoint {
  fecha: string
  remanente: number
  tipo: string
  label: string
}

function CustomTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800">{d.label}</p>
      <p className="text-gray-500 mt-0.5">{d.tipo}</p>
      <p className="font-bold text-sky-700 mt-1">{d.remanente} mm</p>
    </div>
  )
}

function RemanenteChart({ historial, neu }: { historial: MovimientoHistorial[]; neu: NeumaticoBuscado }) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...historial]
      .filter((m) => m.REMANENTE_MEDIDO_MM != null && m.REMANENTE_MEDIDO_MM > 0 && (m.FECHA_INSPECCION || m.FECHA_REGISTRO_MOVIMIENTO))
      .reverse()
      .map((m) => {
        const raw = m.FECHA_INSPECCION || m.FECHA_REGISTRO_MOVIMIENTO
        return {
          fecha: convertToDateHuman(raw),
          remanente: m.REMANENTE_MEDIDO_MM,
          tipo: m.ACCION_REALIZADA,
          label: `${convertToDateHuman(raw)} — ${m.ACCION_REALIZADA}`,
        }
      })
  }, [historial])

  if (chartData.length < 2) return null

  const REMANENTE_MINIMO = 3
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const maxY = Math.max(original, ...chartData.map((d) => d.remanente)) + 2
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const strokeColor = pct >= 60 ? "#14b8a6" : pct >= 30 ? "#eab308" : "#ef4444"
  const fillColor = pct >= 60 ? "#14b8a6" : pct >= 30 ? "#eab308" : "#ef4444"

  return (
    <CollapsibleSection title="Evolución del Remanente" icon={<BarChart3 className="size-4" />}>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="remanenteFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              unit=" mm"
            />
            <RechartsTooltip content={<CustomTooltipContent />} />
            {/* Minimum threshold line */}
            <ReferenceLine
              y={REMANENTE_MINIMO}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Mínimo ${REMANENTE_MINIMO} mm`,
                position: "insideBottomRight",
                fontSize: 10,
                fill: "#ef4444",
              }}
            />
            {/* Original remanente reference */}
            {original > 0 && (
              <ReferenceLine
                y={original}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `Original ${original} mm`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#94a3b8",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="remanente"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#remanenteFill)"
              dot={{ r: 4, fill: "#fff", stroke: strokeColor, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: strokeColor, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CollapsibleSection>
  )
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
    mov.PRESION_AIRE_PSI != null ||
    mov.TORQUE_APLICADO_NM != null ||
    mov.POSICION_ANTERIOR_EN_VEHICULO ||
    mov.USUARIO_REGISTRADOR ||
    mov.OBSERVACION ||
    mov.KM_RECORRIDOS_EN_ETAPA != null

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
          <div className={cn("w-0.5 flex-1 mt-1 rounded-full bg-gradient-to-b", timelineLineColor(mov.ACCION_REALIZADA))} />
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
                {!expanded && mov.REMANENTE_MEDIDO_MM != null && (
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
                  {mov.REMANENTE_MEDIDO_MM != null && (
                    <DetailChip icon={<Gauge className="size-3.5" />} label="Remanente" value={`${mov.REMANENTE_MEDIDO_MM} mm`} />
                  )}
                  {mov.PORCENTAJE_VIDA_UTIL != null && (
                    <DetailChip icon={<Activity className="size-3.5" />} label="Vida útil" value={`${mov.PORCENTAJE_VIDA_UTIL}%`} />
                  )}
                  {mov.KM_RECORRIDOS_EN_ETAPA != null && (
                    <DetailChip icon={<Route className="size-3.5" />} label="Km en etapa" value={mov.KM_RECORRIDOS_EN_ETAPA.toLocaleString("es-PE")} />
                  )}
                  {mov.PRESION_AIRE_PSI != null && (
                    <DetailChip icon={<Wind className="size-3.5" />} label="Presión aire" value={`${mov.PRESION_AIRE_PSI} PSI`} />
                  )}
                  {mov.TORQUE_APLICADO_NM != null && (
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
  const totalInspecciones = historial.length

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
          value={neumatico.REMANENTE_ACTUAL !== null ? `${neumatico.REMANENTE_ACTUAL} mm` : "—"}
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
