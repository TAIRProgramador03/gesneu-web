import React, { useState } from 'react'
import { MovimientoHistorial } from '../../../hooks/use-neumatico-detail';
import { CollapsibleSection } from '../../ui/CollapsibleSection';
import { ChevronDown, Clock } from 'lucide-react';
import { TimelineEventCard } from './TimelineEventCard';
import { cn } from '../../../lib/utils';

export const Timeline = ({ movimientos }: { movimientos: MovimientoHistorial[] }) => {
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
          {movimientos.length} movimientos
        </span>
      }
      border='border-sky-500'
    >
      <div>
        {visible.map((mov, idx) => (
          <TimelineEventCard
            key={`${mov.CODIGO_NEUMATICO}-${mov.FECHA_MOVIMIENTO}-${idx}`}
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
                <>Ver los {movimientos.length} movimientos</>
              )}
              <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
