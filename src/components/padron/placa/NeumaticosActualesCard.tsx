'use client'

import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { NeumaticoInstalado } from '@/hooks/use-placa-detail'
import { cn } from '@/lib/utils'
import { vidaBgBar, vidaColor } from '@/utils/helpers'
import { nivelVida } from '@/utils/estadisticas-placa'
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo'
import { CircleDot } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'

type Orden = 'urgencia' | 'posicion'

const ETIQUETA_NIVEL = { critico: 'crítico', alerta: 'alerta', bueno: 'bueno' } as const

function FilaNeumatico({ neu, resaltada, onResaltar }: {
  neu: NeumaticoInstalado
  resaltada: boolean
  onResaltar: (posicion: string | null) => void
}) {
  const pct = neu.ESTADO
  return (
    <Link
      href={`/padron/neumatico/${neu.CODIGO_NEU}`}
      target="_blank"
      onMouseEnter={() => onResaltar(neu.POSICION_NEU)}
      onMouseLeave={() => onResaltar(null)}
      onFocus={() => onResaltar(neu.POSICION_NEU)}
      onBlur={() => onResaltar(null)}
      id={`neu-${neu.POSICION_NEU}`}
      // `no-underline!`: global.css subraya y pinta de azul todos los enlaces; aquí la fila es una tarjeta.
      className={cn(
        'group relative grid shrink-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border bg-card py-2.5 pl-4 pr-3 text-foreground! no-underline! transition-all hover:bg-superficie-1 hover:shadow-sm',
        resaltada && 'bg-superficie-1 shadow-md ring-2 ring-primary/40'
      )}
    >
      {/* Franja del color de vida; es un elemento propio para no teñir el resto del borde */}
      <span className={cn('absolute inset-y-0 left-0 w-1.5', vidaBgBar(pct))} />
      <span className="rounded-lg bg-superficie-1 py-1.5 text-center text-xs font-extrabold tracking-wider text-cyan-700 dark:text-cyan-300">
        {neu.POSICION_NEU}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold group-hover:text-primary">{neu.CODIGO_NEU}</span>
        <span className="block truncate text-xs text-texto-apagado">
          {neu.REMANENTE} mm · {neu.KM_TOTAL_VIDA ? `${Number(neu.KM_TOTAL_VIDA).toLocaleString('es-PE')} km` : 'sin recorrido'}
          <span className="hidden sm:inline"> · {neu.MARCA} {neu.MEDIDA}</span>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-superficie-2">
          <span className={cn('block h-full rounded-full transition-all duration-700', vidaBgBar(pct))} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </span>
      </span>
      <span className="text-right leading-tight">
        <b className={cn('block text-base font-extrabold tabular-nums', vidaColor(pct))}>{pct}%</b>
        <small className="text-[11px] font-semibold text-texto-apagado">{ETIQUETA_NIVEL[nivelVida(pct)]}</small>
      </span>
    </Link>
  )
}

/**
 * Neumáticos montados: el diagrama real del vehículo (el mismo de /integrations) y, al lado, la lista.
 * Pasar el cursor por una fila resalta su rueda; hacer clic en una rueda resalta su fila.
 */
export const NeumaticosActualesCard = ({
  neumaticos,
  cantidadNeumaticos,
}: {
  neumaticos: NeumaticoInstalado[]
  cantidadNeumaticos?: number | null
}) => {
  const [orden, setOrden] = useState<Orden>('urgencia')
  const [resaltada, setResaltada] = useState<string | null>(null)

  const ordenados = useMemo(
    () => [...neumaticos].sort((a, b) => (orden === 'urgencia' ? a.ESTADO - b.ESTADO : a.POSICION_NEU.localeCompare(b.POSICION_NEU))),
    [neumaticos, orden]
  )

  // El diagrama es memo: la función debe ser estable o se redibuja con cada hover.
  const alClickPosicion = useCallback((neumatico: { POSICION?: string; POSICION_NEU?: string } | undefined, codigoPosicion: string) => {
    if (!neumatico) return
    setResaltada(codigoPosicion)
    document.getElementById(`neu-${codigoPosicion}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <CollapsibleSection
      title="Neumáticos montados"
      icon={<CircleDot className="size-4" />}
      border="border-cyan-500"
      headerRight={
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-400 dark:bg-superficie-2">
          {neumaticos.length} {neumaticos.length === 1 ? 'posición' : 'posiciones'}
        </span>
      }
    >
      {neumaticos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <CircleDot className="mb-3 size-10 opacity-20" />
          <p className="text-sm font-medium">Sin neumáticos asignados</p>
          <p className="mt-1 text-xs">Los neumáticos montados aparecerán aquí junto al diagrama del vehículo.</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[24.5rem_minmax(0,1fr)]">
          {cantidadNeumaticos && (
            // El diagrama reserva ~78 px a cada lado para las etiquetas: 190 px de silueta piden ~346 px.
            <div className="flex justify-center overflow-hidden rounded-2xl bg-linear-to-b from-superficie-1 to-transparent p-2">
              <DiagramaVehiculo
                layout="dashboard"
                etiquetaDatos="remanente"
                anchoMax={190}
                cantidadNeumaticos={cantidadNeumaticos}
                neumaticosAsignados={neumaticos}
                posicionResaltada={resaltada ?? undefined}
                onPosicionClick={alClickPosicion}
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Ordenar neumáticos">
              {([['urgencia', 'Más urgentes primero'], ['posicion', 'Por posición']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={orden === id}
                  onClick={() => setOrden(id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    orden === id
                      ? 'border-transparent bg-sky-50 font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                      : 'bg-card text-texto-apagado hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {ordenados.map((neu) => (
                <FilaNeumatico key={neu.CODIGO_NEU} neu={neu} resaltada={resaltada === neu.POSICION_NEU} onResaltar={setResaltada} />
              ))}
            </div>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}
