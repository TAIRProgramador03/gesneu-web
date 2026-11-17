import { NeumaticoBuscado } from '@/api/Neumaticos'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { Activity, Calendar, Flag, ChartCandlestick, CircleDollarSign, Clock, ParkingMeter, Route, TrendingDown } from 'lucide-react'
import React from 'react'
import { MiniKpi } from './MiniKpi'
import { cn } from '@/lib/utils'
import { borderColor, vidaBgBar } from '@/utils/helpers'
import { REMANENTE_MINIMO, type EstadisticasNeumatico } from '@/utils/estadisticas-neumatico'

/** Una marca sobre la regla de profundidad de banda. `arriba` la lleva sobre la barra, el resto debajo. */
function Marca({ mm, escala, etiqueta, arriba, alinear = 'centro', clase }: {
  mm: number
  escala: number
  etiqueta: string
  arriba?: boolean
  alinear?: 'centro' | 'derecha'
  clase?: string
}) {
  const left = Math.min(100, Math.max(0, (mm / escala) * 100))
  return (
    <div
      className={cn(
        'absolute flex items-center gap-0.5 whitespace-nowrap text-[11px] text-texto-apagado',
        'flex-col',
        arriba ? 'bottom-full' : 'top-full',
        alinear === 'derecha' ? '-translate-x-full items-end' : '-translate-x-1/2'
      )}
      style={{ left: `${left}%` }}
    >
      {/* Arriba: etiqueta, valor y la marca pegada a la barra. Abajo: la marca primero. */}
      <span>{etiqueta}</span>
      <b className="tabular-nums text-xs text-foreground">{mm} mm</b>
      <span className={cn('block h-3 w-0.5 bg-gray-300 dark:bg-slate-600', !arriba && 'order-first', clase)} />
    </div>
  )
}

/** Regla de 0 a REMANENTE_ORIGINAL con el remanente actual y el mínimo marcados. */
function ReglaBanda({ neu }: { neu: NeumaticoBuscado }) {
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const original = neu.REMANENTE_ORIGINAL ?? 0
  const montado = neu.REMANENTE_MONTADO ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0
  const escala = Math.max(original, montado, actual, REMANENTE_MINIMO) || 1

  return (
    <div className="px-2 pb-14 pt-12" role="img" aria-label={`Profundidad de banda: ${actual} mm de ${original} mm originales, mínimo ${REMANENTE_MINIMO} mm`}>
      <div className="relative h-4 rounded-full bg-gray-100 dark:bg-superficie-2">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', vidaBgBar(pct))}
          style={{ width: `${Math.min(100, (actual / escala) * 100)}%` }}
        />
        {/* Zona bajo el mínimo: rayada para que se lea como "no usable" */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full opacity-60"
          style={{
            width: `${(REMANENTE_MINIMO / escala) * 100}%`,
            backgroundImage: 'repeating-linear-gradient(135deg, rgb(239 68 68 / .5) 0 4px, transparent 4px 8px)',
          }}
        />
        <Marca mm={actual} escala={escala} etiqueta="Actual" arriba clase="bg-foreground" />
        <Marca mm={REMANENTE_MINIMO} escala={escala} etiqueta="Mínimo" clase="bg-red-500" />
        {montado > 0 && montado !== original && <Marca mm={montado} escala={escala} etiqueta="Montado" />}
        {original > 0 && <Marca mm={original} escala={escala} etiqueta="Original" alinear="derecha" />}
      </div>
    </div>
  )
}

export const VidaUtilCard = ({ neu, stats }: { neu: NeumaticoBuscado; stats: EstadisticasNeumatico }) => {
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const costo = neu.COSTO_NEUMATICO ?? 0

  const colorDesgaste =
    stats.tasaDesgaste === 0 ? 'bg-gray-50 dark:bg-superficie-1 text-gray-500 dark:text-slate-400'
      : stats.tasaDesgaste <= 1 ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-300'
        : stats.tasaDesgaste <= 2.5 ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-300'
          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300'

  const urgente = stats.diasRestantes !== null && stats.diasRestantes <= 30
  const atencion = stats.diasRestantes !== null && stats.diasRestantes <= 90

  return (
    <CollapsibleSection title="Vida útil y desgaste" icon={<Activity className="size-4" />} border={borderColor(pct)}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Profundidad de banda</p>
          <ReglaBanda neu={neu} />
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-texto-apagado">
            <span>Desgaste desde el montaje <b className="tabular-nums text-foreground">{stats.mmDesgastados.toFixed(1)} mm</b></span>
            <span>Margen hasta el mínimo <b className="tabular-nums text-foreground">{stats.mmRestantes.toFixed(1)} mm</b></span>
          </div>
        </div>

        {/* Sin vehículo no hay proyección: se muestra el balance de lo que rindió en servicio */}
        {!neu.PLACA_ACTUAL && (stats.kmTotal > 0 || stats.diasDeRecorrido > 0) && (
          <div className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-white p-4 dark:border-sky-500/30 dark:from-sky-500/10 dark:to-card">
            <div className="mb-3 flex items-center gap-2 text-sky-700 dark:text-sky-300">
              <Flag className="size-4" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Balance de su vida en servicio</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { l: 'Recorrido total', v: stats.kmTotal > 0 ? stats.kmTotal.toLocaleString('es-PE') : '—', u: 'km' },
                { l: 'Tiempo en servicio', v: stats.diasDeRecorrido > 0 ? `${stats.diasDeRecorrido}` : '—', u: 'días' },
                { l: 'Desgaste total', v: stats.mmDesgastados.toFixed(1), u: 'mm' },
                { l: 'Costo por km', v: stats.costoPorKm > 0 ? stats.costoPorKm.toFixed(4) : '—', u: '$/km' },
              ].map((d) => (
                <div key={d.l} className="rounded-lg border bg-card px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{d.l}</p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums">
                    {d.v} <span className="text-xs font-semibold text-texto-apagado">{d.u}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.diasRestantes !== null && stats.diasRestantes > 0 && neu.PLACA_ACTUAL && (
          <div
            role="status"
            className={cn(
              'grid items-center gap-4 rounded-xl border p-4 sm:grid-cols-[auto_1fr]',
              urgente ? 'border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10'
                : atencion ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10'
                  : 'border-teal-200 bg-teal-50/60 dark:border-teal-500/30 dark:bg-teal-500/10'
            )}
          >
            <div className="flex items-center gap-3">
              <Clock className={cn('size-5', urgente ? 'text-red-600 dark:text-red-300' : atencion ? 'text-amber-600 dark:text-amber-300' : 'text-teal-600 dark:text-teal-300')} />
              <div>
                <p className={cn('text-3xl font-extrabold leading-none tabular-nums', urgente ? 'text-red-700 dark:text-red-300' : atencion ? 'text-amber-700 dark:text-amber-300' : 'text-teal-700 dark:text-teal-300')}>
                  ~{stats.diasRestantes}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-texto-apagado">días restantes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {stats.fechaEstimada && (
                <div className="rounded-lg border bg-card px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Fecha estimada</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {stats.fechaEstimada.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
              {stats.kmRestantes !== null && (
                <div className="rounded-lg border bg-card px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Km restantes</p>
                  <p className="text-sm font-semibold tabular-nums">~{Math.round(stats.kmRestantes).toLocaleString('es-PE')} km</p>
                </div>
              )}
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ritmo</p>
                <p className="text-sm font-semibold tabular-nums">{stats.tasaDiaria.toFixed(3)} mm/día</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <MiniKpi
            icon={<Route className="size-3.5" />}
            label="Km recorridos"
            value={stats.kmTotal > 0 ? stats.kmTotal.toLocaleString('es-PE') : '—'}
            sub={stats.kmTotal > 0 ? 'acumulados' : 'sin datos'}
            color="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300"
          />
          <MiniKpi
            icon={<TrendingDown className="size-3.5" />}
            label="Tasa desgaste"
            value={stats.tasaDesgaste > 0 ? stats.tasaDesgaste.toFixed(2) : '—'}
            sub={stats.tasaDesgaste > 0 ? 'mm / 1,000 km' : 'sin datos'}
            color={colorDesgaste}
          />
          <MiniKpi
            icon={<Calendar className="size-3.5" />}
            label="Días en recorrido"
            value={stats.diasDeRecorrido > 0 ? `${stats.diasDeRecorrido}` : '—'}
            sub={stats.diasDeRecorrido > 0 ? `≈ ${Math.round(stats.diasDeRecorrido / 30)} meses` : 'sin datos'}
            color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
          />
          <MiniKpi
            icon={<CircleDollarSign className="size-3.5" />}
            label="Costo por km"
            value={stats.costoPorKm > 0 ? stats.costoPorKm.toFixed(5) : '—'}
            sub={stats.costoPorKm > 0 ? `$${costo} / ${stats.kmTotal} km` : 'sin datos'}
            color="bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-300"
          />
          <MiniKpi
            icon={<ChartCandlestick className="size-3.5" />}
            label="Costo por mm"
            value={stats.costoPorMm > 0 ? stats.costoPorMm.toFixed(5) : '—'}
            sub={stats.costoPorMm > 0 ? `$${costo} / ${stats.mmDesgastados.toFixed(1)} mm` : 'sin datos'}
            color="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300"
          />
          <MiniKpi
            icon={<ParkingMeter className="size-3.5" />}
            label="Km por mm"
            value={stats.kmPorMm > 0 ? stats.kmPorMm.toFixed(2) : '—'}
            sub={stats.kmPorMm > 0 ? `${stats.kmTotal} km / ${stats.mmDesgastados.toFixed(1)} mm` : 'sin datos'}
            color="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-300"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
