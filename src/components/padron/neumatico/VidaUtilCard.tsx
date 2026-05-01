import { NeumaticoBuscado } from '@/api/Neumaticos';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { MovimientoHistorial } from '@/hooks/use-neumatico-detail';
import { Activity, Calendar, ChartCandlestick, CircleDollarSign, Clock, ParkingMeter, Route, TrendingDown, Zap } from 'lucide-react';
import React, { useMemo } from 'react'
import { SemiGauge } from './SemiGauge';
import { MiniKpi } from './MiniKpi';
import { cn } from '@/lib/utils';
import { ComparisonBar } from './ComparisonBar';
import { Sparkline } from './Sparkline';
import { borderColor, vidaBgGradient, vidaColor } from '@/utils/helpers';

export const VidaUtilCard = ({ neu, historial }: { neu: NeumaticoBuscado; historial: MovimientoHistorial[] }) => {

  const pct = neu.PORCENTAJE_VIDA ?? 0
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const montado = neu.REMANENTE_MONTADO ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0

  const stats = useMemo(() => {

    const kmTotal = historial.reduce((acc, m) => acc + (m.KM_RECORRIDOS_EN_ETAPA ?? 0), 0)

    const mmDesgastados = montado - actual
    const tasaDesgaste = kmTotal > 0 ? (mmDesgastados / kmTotal) * 1000 : 0

    let diasServicio = 0
    if (historial.length > 0) {
      const latest = Date.now()
      const earliest = Date.parse(historial[historial.length - 1].FECHA_MOVIMIENTO)
      diasServicio = Math.max(0, Math.round((latest - earliest) / (1000 * 60 * 60 * 24)))
    }

    const remanenteSeries = [...historial]
      .map((m) => m.REMANENTE_MEDIDO_MM)
    const qtyInspecciones = [...historial].filter((m) => m.ID_ACCION_REALIZADA === 7).length

    const REMANENTE_MINIMO = 3
    const mmRestantes = Math.max(0, actual - REMANENTE_MINIMO)
    const kmRestantes = tasaDesgaste > 0 ? (mmRestantes / tasaDesgaste) * 1000 : null
    const tasaDiaria = diasServicio > 0 ? mmDesgastados / diasServicio : 0
    const diasRestantes = tasaDiaria > 0 ? Math.round(mmRestantes / tasaDiaria) : null
    const fechaEstimada = diasRestantes !== null
      ? new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000)
      : null

    const costoPorkM = kmTotal >= 1 ? neu.COSTO_NEUMATICO / kmTotal : 0
    const costoPorMm = kmTotal >= 1 ? neu.COSTO_NEUMATICO / mmDesgastados : 0
    const kmPorMm = kmTotal ? kmTotal / mmDesgastados : 0

    return {
      kmTotal, tasaDesgaste, diasServicio, remanenteSeries, mmDesgastados,
      kmRestantes, diasRestantes, fechaEstimada, mmRestantes, REMANENTE_MINIMO, qtyInspecciones,
      costoPorkM, costoPorMm, kmPorMm
    }
  }, [historial, original, actual])

  return (
    <CollapsibleSection title="Vida Útil" icon={<Activity className="size-4" />} border={borderColor(pct)} >
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
          <MiniKpi
            icon={<CircleDollarSign className="size-3.5" />}
            label="Costo * Km."
            value={stats.costoPorkM > 0 ? `${stats.costoPorkM.toFixed(5)}` : "—"}
            sub={stats.costoPorkM > 0 ? `$${neu.COSTO_NEUMATICO} / ${stats.kmTotal}km.` : "sin datos"}
            color="bg-pink-50 text-pink-600"
          />
          <MiniKpi
            icon={<ChartCandlestick className="size-3.5" />}
            label="Costo * mm"
            value={stats.costoPorMm > 0 ? `${stats.costoPorMm.toFixed(5)}` : "—"}
            sub={stats.costoPorMm > 0 ? `$${neu.COSTO_NEUMATICO} / ${stats.mmDesgastados}mm` : "sin datos"}
            color="bg-purple-50 text-purple-600"
          />
          <MiniKpi
            icon={<ParkingMeter className="size-3.5" />}
            label="Km. * mm"
            value={stats.kmPorMm > 0 ? `${stats.kmPorMm.toFixed(2)}` : "—"}
            sub={stats.kmPorMm > 0 ? `${stats.kmTotal}km. / ${stats.mmDesgastados}mm` : "sin datos"}
            color="bg-orange-50 text-orange-600"
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
            <div className="rounded-xl border border-gray-100 bg-linear-to-br from-white to-gray-50/40 p-4">
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
                  {stats.qtyInspecciones} inspecciones
                </div>
                <span className={cn("font-semibold", vidaColor(pct))}>
                  {stats.remanenteSeries[stats.remanenteSeries.length - 1]} mm
                </span>
              </div>

            </div>
          </div>
        )}


        {/* Projection: estimated remaining life */}
        {stats.diasRestantes !== null && stats.diasRestantes > 0 && (
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
                ? "border-red-200 bg-linear-to-br from-red-50/50 to-white"
                : stats.diasRestantes <= 90
                  ? "border-amber-200 bg-linear-to-br from-amber-50/50 to-white"
                  : "border-teal-200 bg-linear-to-br from-teal-50/50 to-white"
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
                    al ritmo actual de desgaste ({stats.mmRestantes.toFixed(1)} mm restantes)
                    <br />(mínimo de {stats.REMANENTE_MINIMO} mm)
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
                {stats.kmRestantes !== null && (
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
