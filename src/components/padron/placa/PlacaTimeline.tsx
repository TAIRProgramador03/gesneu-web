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

export const PlacaTimeline = ({ movimientos }: { movimientos: NeumaticoDelHistorial[] }) => {
  const [showAll, setShowAll] = useState(false)

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

  if (agrupados.length === 0) {
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

  const visible = showAll ? agrupados : agrupados.slice(0, 6)

  return (
    <CollapsibleSection
      title="Línea de Tiempo"
      icon={<Clock className="size-4" />}
      headerRight={
        <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
          {agrupados.length} eventos
        </span>
      }
      border="border-sky-500"
    >
      <div>
        {visible.map((mov, idx) => (
          <PlacaTimelineEventCard
            key={mov.groupKey}
            mov={mov}
            isLast={idx === visible.length - 1}
          />
        ))}

        {agrupados.length > 6 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-full px-5 py-2 transition-colors"
            >
              {showAll ? 'Mostrar menos' : `Ver los ${agrupados.length} eventos`}
              <ChevronDown className={cn('size-3.5 transition-transform', showAll && 'rotate-180')} />
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
