'use client'

import { NeumaticoBuscado } from '@/api/Neumaticos'
import { TextoRecuperadoBadge } from '@/components/ui/TextoRecuperadoBadge'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { cn, convertToDateHuman, diasDesdeFecha } from '@/lib/utils'
import type { MovimientoHistorial } from '@/hooks/use-neumatico-detail'
import { vidaColor, vidaRingColor, vidaTrackColor } from '@/utils/helpers'
import type { EstadisticasNeumatico } from '@/utils/estadisticas-neumatico'
import { REMANENTE_MINIMO } from '@/utils/estadisticas-neumatico'
import { PackageCheck, PackageMinus, Tag, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const RADIO = 56
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/** Neumático visto de frente: banda de dibujo + anillo con el % de vida útil. */
function NeumaticoVida({ pct }: { pct: number }) {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const valor = Math.min(100, Math.max(0, pct))
  const offset = CIRCUNFERENCIA * (1 - valor / 100)

  return (
    <div className="relative size-42 shrink-0" role="img" aria-label={`Vida útil ${pct}%`}>
      <svg viewBox="0 0 168 168" className="size-full">
        <circle cx="84" cy="84" r="80" className="fill-slate-700 dark:fill-slate-800" />
        <circle cx="84" cy="84" r="72" fill="none" strokeWidth="14" strokeDasharray="7 4.6" className="stroke-slate-900 dark:stroke-black" />
        <circle cx="84" cy="84" r={RADIO} className="fill-card" />
        <circle cx="84" cy="84" r={RADIO} fill="none" strokeWidth="6" className={vidaTrackColor(pct)} />
        <circle
          cx="84" cy="84" r={RADIO} fill="none" strokeWidth="6" strokeLinecap="round"
          className={cn('origin-center -rotate-90', vidaRingColor(pct))}
          style={{
            strokeDasharray: CIRCUNFERENCIA,
            strokeDashoffset: listo ? offset : CIRCUNFERENCIA,
            transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <b className={cn('block text-3xl font-extrabold leading-none tabular-nums', vidaColor(pct))}>{pct}%</b>
          <span className="text-[10px] font-bold uppercase tracking-widest text-texto-apagado">vida útil</span>
        </div>
      </div>
    </div>
  )
}

/** Mensaje principal bajo el nombre: depende de en qué situación está el neumático. */
function Aviso({ neu, stats, ultimoMov }: { neu: NeumaticoBuscado; stats: EstadisticasNeumatico; ultimoMov?: MovimientoHistorial }) {
  // Las clases van completas (nada de plantillas): Tailwind sólo detecta texto literal.
  const remanente = neu.REMANENTE_ACTUAL ?? 0
  const fecha = ultimoMov ? convertToDateHuman(ultimoMov.FECHA_MOVIMIENTO) : null
  let tono = ''
  let mensaje: React.ReactNode = null
  let Icono = TriangleAlert

  if (neu.SITUACION_NEUMATICO === 'BAJA') {
    tono = 'bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200'
    Icono = PackageMinus
    mensaje = (
      <>
        <b>Dado de baja{fecha ? ` el ${fecha}` : ''}</b> con {remanente} mm de remanente
        {stats.kmTotal > 0 && <> tras <b>{stats.kmTotal.toLocaleString('es-PE')} km</b> recorridos</>}.
        {ultimoMov?.OBSERVACION && <span className="mt-1 block opacity-90">Motivo: {ultimoMov.OBSERVACION}</span>}
      </>
    )
  } else if (neu.SITUACION_NEUMATICO === 'VENDIDO') {
    tono = 'bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-200'
    Icono = Tag
    mensaje = <><b>Vendido{fecha ? ` el ${fecha}` : ''}</b>. Ya no forma parte de la flota.</>
  } else if (!neu.PLACA_ACTUAL) {
    tono = 'bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200'
    Icono = PackageCheck
    mensaje = <><b>Disponible{neu.TALLER_ACTUAL ? ` en ${neu.TALLER_ACTUAL}` : ''}</b>. Puede asignarse a un vehículo.</>
  } else if (remanente <= REMANENTE_MINIMO) {
    tono = 'bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200'
    mensaje = <>Ya está en el remanente mínimo de <b>{REMANENTE_MINIMO} mm</b>. Debe retirarse del servicio.</>
  } else if (stats.diasRestantes !== null && stats.diasRestantes > 0) {
    tono = stats.diasRestantes <= 30
      ? 'bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200'
      : stats.diasRestantes <= 90
        ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
        : 'bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200'
    mensaje = (
      <>
        Al ritmo actual llegará a {REMANENTE_MINIMO} mm en <b>~{stats.diasRestantes} días</b>
        {stats.diasRestantes <= 90 ? '. Conviene programar su rotación o reemplazo.' : '.'}
      </>
    )
  }

  if (!mensaje) return null
  return (
    <div role="status" className={cn('mt-4 flex max-w-xl items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm', tono)}>
      <Icono className="mt-0.5 size-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  )
}

/** Franja superior y fondo tintado del hero según la situación (literales: ver nota en Aviso). */
function tinte(pct: number, situacion: string) {
  if (situacion === 'BAJA') return { borde: 'border-t-red-500', fondo: 'from-red-50 dark:from-red-500/10' }
  if (situacion === 'VENDIDO') return { borde: 'border-t-fuchsia-500', fondo: 'from-fuchsia-50 dark:from-fuchsia-500/10' }
  if (pct < 39) return { borde: 'border-t-vida-critico', fondo: 'from-red-50 dark:from-red-500/10' }
  if (pct < 79) return { borde: 'border-t-vida-alerta', fondo: 'from-yellow-50 dark:from-yellow-500/10' }
  return { borde: 'border-t-vida-ok', fondo: 'from-green-50 dark:from-green-500/10' }
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="mt-0.5 text-sm font-semibold wrap-break-word text-gray-900 dark:text-slate-100">{children}</div>
    </div>
  )
}

export const HeroHeader = ({
  neu,
  stats,
  posicion,
  ultimaPlaca,
  ultimaPosicion,
  ultimoMov,
}: {
  neu: NeumaticoBuscado
  stats: EstadisticasNeumatico
  /** Posición actual en el vehículo (POS03…), si está montado. */
  posicion?: string | null
  /** Último vehículo donde estuvo (igual a la placa actual si está montado). */
  ultimaPlaca?: string
  ultimaPosicion?: string | null
  /** Último movimiento del historial: da fecha y motivo de la baja. */
  ultimoMov?: MovimientoHistorial
}) => {
  const pct = neu.PORCENTAJE_VIDA ?? 0
  const situacion = neu.SITUACION_NEUMATICO ?? ''
  const diasMontado = stats.fechaMontaje ? diasDesdeFecha(stats.fechaMontaje) : null
  const montado = !!neu.PLACA_ACTUAL
  const t = tinte(pct, situacion)

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-t-4 bg-linear-to-br to-white shadow-sm dark:to-card', t.borde, t.fondo)}>
      <div className="grid grid-cols-1 items-center gap-6 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="mx-auto md:mx-0"><NeumaticoVida pct={pct} /></div>

        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
              {neu.CODIGO_NEUMATICO}
            </h1>
            <TipoMovimientoBadge tipoMovimiento={situacion} />
            <TextoRecuperadoBadge esRecuperado={neu.RECUPERADO_NEUMATICO} />
          </div>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">
            {neu.MARCA_NEUMATICO} &middot; {neu.MEDIDA_NEUMATICO} &middot; {neu.DISENO_NEUMATICO}
          </p>

          {ultimaPlaca && (
            <div className="mt-3.5 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-texto-apagado">
                {montado ? 'Placa' : 'Última placa'} <b className="font-semibold text-foreground">{ultimaPlaca}</b>
              </span>
              {(posicion ?? ultimaPosicion) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-texto-apagado">
                  {montado ? 'Posición' : 'Última posición'} <b className="font-semibold text-foreground">{posicion ?? ultimaPosicion}</b>
                </span>
              )}
            </div>
          )}

          <Aviso neu={neu} stats={stats} ultimoMov={ultimoMov} />
        </div>

        {ultimaPlaca && (
          <div className="flex flex-col gap-2 md:min-w-44">
            <Link
              href={`/padron/placa/${ultimaPlaca}`}
              // `!`: global.css define `a { color: var(--primary) }` fuera de capas y le gana a la utilidad,
              // dejando el texto del mismo color que el fondo del botón.
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground! no-underline! transition hover:brightness-110"
            >
              {montado ? 'Ver placa' : 'Ver última placa'} {ultimaPlaca}
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x border-t bg-card/60 max-lg:[&>*:nth-child(n+3)]:border-t lg:grid-cols-4">
        {montado ? (
          <Dato label="Montado desde">
            {stats.fechaMontaje
              ? <>{convertToDateHuman(stats.fechaMontaje)}{diasMontado !== null && <span className="font-medium text-texto-apagado"> · hace {diasMontado} d</span>}</>
              : '—'}
          </Dato>
        ) : (
          <Dato label={situacion === 'BAJA' ? 'Fecha de baja' : 'Último movimiento'}>
            {ultimoMov
              ? <>{convertToDateHuman(ultimoMov.FECHA_MOVIMIENTO)}<span className="font-medium text-texto-apagado"> · {ultimoMov.ACCION_REALIZADA.toLowerCase()}</span></>
              : '—'}
          </Dato>
        )}
        <Dato label={montado ? 'Taller actual' : 'Último taller'}>{neu.TALLER_ACTUAL || '—'}</Dato>
        <Dato label="Proveedor">{neu.PROVEEDOR_NEUMATICO || '—'}</Dato>
        <Dato label="Costo">${(neu.COSTO_NEUMATICO ?? 0).toLocaleString('es-PE')}</Dato>
      </div>
    </div>
  )
}
