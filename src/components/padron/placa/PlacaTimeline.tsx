import React, { useMemo, useState } from 'react'
import { NeumaticoDelHistorial } from '@/api/Neumaticos'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { ChevronDown, Clock } from 'lucide-react'
import { PlacaTimelineEventCard } from './PlacaTimelineEventCard'
import { cn } from '@/lib/utils'

export interface MovimientoAgrupado {
  groupKey: string
  TALLER_ASIGNADO: string
  ID_ACCION_REALIZADA: number
  ACCION_REALIZADA: string
  FECHA_MOVIMIENTO: string | null
  USUARIO_REGISTRADOR: string
  KILOMETRAJE: null | number
  TERRENO: null | string
  CONDICION: null | string
  NEUMATICOS: NeumaticoDelHistorial[]
}

const toGroupKey = (mov: NeumaticoDelHistorial) => {
  const fecha = mov.FECHA_MOVIMIENTO
    ? String(mov.FECHA_MOVIMIENTO).substring(0, 10)
    : String(mov.FECHA_REGISTRO_MOVIMIENTO).substring(0, 10)
  return `${fecha}_${mov.ID_ACCION_REALIZADA}`
}

// Grupos del filtro, por ID_ACCION_REALIZADA (2 montaje · 4 rotación · 5 baja · 6 recupero · 7 inspección)
const FILTROS: { id: string; label: string; acciones: number[] | null }[] = [
  { id: 'todos', label: 'Todos', acciones: null },
  { id: 'montajes', label: 'Montajes', acciones: [2] },
  { id: 'inspecciones', label: 'Inspecciones', acciones: [7] },
  { id: 'rotaciones', label: 'Rotaciones', acciones: [4] },
  { id: 'bajas', label: 'Bajas', acciones: [5, 6] },
]

export const PlacaTimeline = ({ movimientos }: { movimientos: NeumaticoDelHistorial[] }) => {
  const [showAll, setShowAll] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  const agrupados = useMemo(() => {
    const map = new Map<string, MovimientoAgrupado>()
    for (const mov of movimientos) {
      const key = toGroupKey(mov)
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          TALLER_ASIGNADO: mov.TALLER_ASIGNADO,
          ID_ACCION_REALIZADA: mov.ID_ACCION_REALIZADA,
          ACCION_REALIZADA: mov.ACCION_REALIZADA,
          FECHA_MOVIMIENTO: mov.FECHA_MOVIMIENTO ? String(mov.FECHA_MOVIMIENTO) : null,
          USUARIO_REGISTRADOR: mov.USUARIO_REGISTRADOR,
          KILOMETRAJE: mov.CAMBIO_KILOMETRAJE ?? null,
          TERRENO: mov.TIPO_TERRENO ?? null,
          CONDICION: mov.CONDICION ?? null,
          NEUMATICOS: [],
        })
      }
      map.get(key)!.NEUMATICOS.push(mov)
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.FECHA_MOVIMIENTO ?? 0).getTime() - new Date(a.FECHA_MOVIMIENTO ?? 0).getTime()
    )
  }, [movimientos])

  const grupo = FILTROS.find((f) => f.id === filtro)?.acciones ?? null
  const filtrados = grupo ? agrupados.filter((g) => grupo.includes(g.ID_ACCION_REALIZADA)) : agrupados
  // Sólo se ofrecen los filtros que tienen algo que mostrar
  const filtrosDisponibles = FILTROS.filter((f) => !f.acciones || agrupados.some((g) => f.acciones!.includes(g.ID_ACCION_REALIZADA)))

  if (agrupados.length === 0) {
    return (
      <CollapsibleSection title="Línea de Tiempo" icon={<Clock className="size-4" />}>
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="rounded-2xl bg-gray-50 dark:bg-superficie-1 p-5 mb-4">
            <Clock className="size-10 opacity-30" />
          </div>
          <p className="text-sm font-medium text-gray-400">Sin movimientos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Los movimientos aparecerán aquí a medida que se registren.</p>
        </div>
      </CollapsibleSection>
    )
  }

  const visible = showAll ? filtrados : filtrados.slice(0, 6)

  return (
    <CollapsibleSection
      title="Línea de Tiempo"
      icon={<Clock className="size-4" />}
      headerRight={
        <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-superficie-2 rounded-full px-2.5 py-0.5">
          {filtrados.length} eventos
        </span>
      }
      border="border-indigo-500"
    >
      <div>
        {filtrosDisponibles.length > 2 && (
          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar movimientos">
            {filtrosDisponibles.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => { setFiltro(f.id); setShowAll(false) }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  filtro === f.id
                    ? 'border-transparent bg-sky-50 font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                    : 'bg-card text-texto-apagado hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        {visible.map((mov, idx) => (
          <PlacaTimelineEventCard
            key={mov.groupKey}
            mov={mov}
            isLast={idx === visible.length - 1}
          />
        ))}

        {filtrados.length > 6 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-200 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/15 rounded-full px-5 py-2 transition-colors"
            >
              {showAll ? 'Mostrar menos' : `Ver los ${filtrados.length} eventos`}
              <ChevronDown className={cn('size-3.5 transition-transform', showAll && 'rotate-180')} />
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
