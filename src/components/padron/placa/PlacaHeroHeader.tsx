'use client'

import { VehiculoMain } from '@/hooks/use-placa-detail'
import { cn, convertToDateHuman } from '@/lib/utils'
import { vidaColor, vidaRingColor, vidaTrackColor } from '@/utils/helpers'
import { obtenerConfiguracionNeumaticos } from '@/utils/configuraciones-neumaticos'
import type { EstadisticasPlaca } from '@/utils/estadisticas-placa'
import { CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const RADIO = 54
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * La placa como objeto físico: queda clara en modo oscuro también, porque una placa real no cambia
 * de color con el tema. Es el detalle que sólo tiene esta pantalla.
 */
function Placa({ placa }: { placa: string }) {
  return (
    <div
      className="inline-flex flex-col items-center overflow-hidden rounded-[10px] border-[3px] border-neutral-900 bg-white text-neutral-900 shadow-[0_2px_0_rgb(0_0_0/18%)]"
      role="img"
      aria-label={`Placa ${placa}`}
    >
      <span className="w-full bg-[#c8102e] py-[3px] text-center text-[9px] font-bold leading-none tracking-[0.3em] text-white">PERÚ</span>
      <b className="px-4 pb-1.5 pt-1.5 text-[28px] font-extrabold leading-none tracking-[0.08em] tabular-nums sm:px-5 sm:text-[34px]">{placa}</b>
    </div>
  )
}

/** Anillo con la vida promedio de los neumáticos montados. */
function AnilloSalud({ pct }: { pct: number }) {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const offset = CIRCUNFERENCIA * (1 - Math.min(100, Math.max(0, pct)) / 100)

  return (
    <div className="relative size-33 shrink-0" role="img" aria-label={`Vida promedio de los neumáticos ${pct}%`}>
      <svg viewBox="0 0 132 132" className="size-full">
        <circle cx="66" cy="66" r={RADIO} fill="none" strokeWidth="12" className={vidaTrackColor(pct)} />
        <circle
          cx="66" cy="66" r={RADIO} fill="none" strokeWidth="12" strokeLinecap="round"
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-texto-apagado">vida prom.</span>
        </div>
      </div>
    </div>
  )
}

function Aviso({ tono, icono: Icono, children }: { tono: string; icono: React.ElementType; children: React.ReactNode }) {
  return (
    <div role="status" className={cn('flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm', tono)}>
      <Icono className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// Las clases van completas (nada de plantillas): Tailwind sólo detecta texto literal.
const ROJO = 'bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200'
const AMBAR = 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
const VERDE = 'bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-200'
const CELESTE = 'bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200'

function Avisos({ stats }: { stats: EstadisticasPlaca }) {
  const { montados, niveles, masCritico, ultimaInspeccion: insp } = stats

  const salud = montados === 0 ? (
    <Aviso tono={CELESTE} icono={CircleDashed}>
      <b>Sin neumáticos montados.</b> Cuando se asigne el primero aparecerá aquí su estado.
    </Aviso>
  ) : niveles.critico > 0 && masCritico ? (
    <Aviso tono={ROJO} icono={TriangleAlert}>
      {niveles.critico === 1
        ? <><b>{masCritico.POSICION_NEU} · {masCritico.CODIGO_NEU}</b> está en zona crítica ({masCritico.REMANENTE} mm).</>
        : <><b>{niveles.critico} neumáticos en zona crítica</b>; el más bajo es <b>{masCritico.POSICION_NEU}</b> ({masCritico.REMANENTE} mm).</>}
      {niveles.alerta > 0 && <> Además hay <b>{niveles.alerta} en alerta</b>.</>}
    </Aviso>
  ) : niveles.alerta > 0 ? (
    <Aviso tono={AMBAR} icono={TriangleAlert}>
      <b>{niveles.alerta} {niveles.alerta === 1 ? 'neumático en alerta' : 'neumáticos en alerta'}</b>. Conviene programar su rotación o reemplazo.
    </Aviso>
  ) : (
    <Aviso tono={VERDE} icono={CircleCheck}>Todos los neumáticos montados están en buen estado.</Aviso>
  )

  const inspeccion = !insp ? (
    <Aviso tono={AMBAR} icono={TriangleAlert}><b>Sin inspecciones registradas</b> para esta placa.</Aviso>
  ) : insp.vigente ? (
    <Aviso tono={VERDE} icono={CircleCheck}>
      <b>Inspección vigente</b>: la última fue {insp.dias === 0 ? 'hoy' : <>hace <b>{insp.dias} {insp.dias === 1 ? 'día' : 'días'}</b></>}.
      {' '}La próxima se exige en {insp.diasParaVencer} {insp.diasParaVencer === 1 ? 'día' : 'días'}.
    </Aviso>
  ) : (
    <Aviso tono={ROJO} icono={TriangleAlert}>
      <b>Requiere nueva inspección</b>: la última fue hace <b>{insp.dias} días</b>.
    </Aviso>
  )

  return <div className="mt-4 flex max-w-xl flex-col gap-2">{salud}{inspeccion}</div>
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="mt-0.5 text-sm font-semibold wrap-break-word text-gray-900 dark:text-slate-100">{children}</div>
    </div>
  )
}

/** Franja superior y fondo tintado según la vida promedio (literales: ver nota en Avisos). */
function tinte(promedio: number | null) {
  if (promedio === null) return { borde: 'border-t-sky-500', fondo: 'from-sky-50 dark:from-sky-500/10' }
  if (promedio < 39) return { borde: 'border-t-vida-critico', fondo: 'from-red-50 dark:from-red-500/10' }
  if (promedio < 79) return { borde: 'border-t-vida-alerta', fondo: 'from-yellow-50 dark:from-yellow-500/10' }
  return { borde: 'border-t-vida-ok', fondo: 'from-green-50 dark:from-green-500/10' }
}

export const PlacaHeroHeader = ({ vehiculo, stats }: { vehiculo: VehiculoMain; stats: EstadisticasPlaca }) => {
  const t = tinte(stats.promedioVida)
  const km = vehiculo.KILOMETRAJE_GESNEU !== null ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE
  const config = obtenerConfiguracionNeumaticos(vehiculo.CANTIDAD_NEUMATICOS)
  const insp = stats.ultimaInspeccion

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-t-4 bg-linear-to-br to-white shadow-sm dark:to-card', t.borde, t.fondo)}>
      <div className="grid grid-cols-1 items-center gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
            <Placa placa={vehiculo.PLACA} />
            {vehiculo.OPERACION && (
              <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                {vehiculo.OPERACION}
              </span>
            )}
          </div>
          <p className="mt-2.5 text-sm text-gray-500 dark:text-slate-400">
            {vehiculo.MARCA} {vehiculo.TIPO} {vehiculo.MODELO} &middot; {vehiculo.ANO}
            {vehiculo.COLOR ? ` · ${vehiculo.COLOR}` : ''}
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
            {[
              ['Terreno', vehiculo.TIPO_TERRENO],
              ['Condición', vehiculo.RETEN],
              ['Taller', vehiculo.TALLER],
            ].filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-texto-apagado">
                {k} <b className="font-semibold text-foreground">{v}</b>
              </span>
            ))}
          </div>

          <Avisos stats={stats} />
        </div>

        {stats.montados > 0 && stats.promedioVida !== null && (
          <div className="mx-auto flex items-center gap-5 lg:mx-0" aria-label="Salud de los neumáticos">
            <AnilloSalud pct={stats.promedioVida} />
            <ul className="flex min-w-36 flex-col gap-2 text-sm">
              {[
                { k: 'Buenos', n: stats.niveles.bueno, c: 'bg-vida-ok' },
                { k: 'En alerta', n: stats.niveles.alerta, c: 'bg-vida-alerta' },
                { k: 'Críticos', n: stats.niveles.critico, c: 'bg-vida-critico' },
              ].map((f) => (
                <li key={f.k} className="flex items-center gap-2">
                  <i className={cn('size-2.5 rounded-[3px]', f.c)} />
                  {f.k}
                  <b className="ml-auto tabular-nums">{f.n}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x border-t bg-card/60 max-lg:[&>*:nth-child(n+3)]:border-t lg:grid-cols-4">
        <Dato label="Kilometraje">{km.toLocaleString('es-PE')} km</Dato>
        <Dato label="Última inspección">
          {insp
            ? <>{convertToDateHuman(insp.fecha)}{insp.dias !== null && <span className="font-medium text-texto-apagado"> · {insp.dias === 0 ? 'hoy' : `hace ${insp.dias} d`}</span>}</>
            : <span className="font-medium text-texto-apagado">Sin inspecciones</span>}
        </Dato>
        <Dato label="Último movimiento">
          {stats.ultimoMovimiento
            ? <>{stats.ultimoMovimiento.accion.charAt(0).toUpperCase() + stats.ultimoMovimiento.accion.slice(1).toLowerCase()}<span className="font-medium text-texto-apagado"> · {convertToDateHuman(stats.ultimoMovimiento.fecha)}</span></>
            : <span className="font-medium text-texto-apagado">Sin movimientos</span>}
        </Dato>
        <Dato label="Neumáticos">
          {stats.montados}
          <span className="font-medium text-texto-apagado">
            {config ? ` de ${config.posiciones.length} posiciones · ${config.nombre.toLowerCase()}` : ' montados'}
          </span>
        </Dato>
      </div>
    </div>
  )
}
