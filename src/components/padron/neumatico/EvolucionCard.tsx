'use client'

import { NeumaticoBuscado } from '@/api/Neumaticos'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { MovimientoHistorial } from '@/hooks/use-neumatico-detail'
import { cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import React, { useState } from 'react'
import { KilometrajeChart } from './KilometrajeChart'
import { RemanenteChart } from './RemanenteChart'

type Vista = 'remanente' | 'kilometraje'

/** Remanente y kilometraje en una sola tarjeta con pestañas, en vez de dos gráficos apilados. */
export const EvolucionCard = ({ historial, neu }: { historial: MovimientoHistorial[]; neu: NeumaticoBuscado }) => {
  // Mismas condiciones con las que cada gráfico decide si se dibuja.
  const hayRemanente = historial.length >= 2
  const hayKm = historial.some((h) => h.ACCION_REALIZADA === 'INSPECCION RUTINARIA' && h.KM_RECORRIDOS_EN_ETAPA !== 0)

  const [vista, setVista] = useState<Vista>('remanente')

  if (!hayRemanente && !hayKm) return null
  const activa: Vista = vista === 'remanente' && !hayRemanente ? 'kilometraje' : vista === 'kilometraje' && !hayKm ? 'remanente' : vista

  const pestanas: { id: Vista; label: string; activa: boolean }[] = [
    { id: 'remanente', label: 'Remanente', activa: hayRemanente },
    { id: 'kilometraje', label: 'Kilometraje', activa: hayKm },
  ]

  return (
    <CollapsibleSection
      title="Evolución"
      icon={<BarChart3 className="size-4" />}
      border="border-teal-500"
      headerRight={
        // El header es un botón que pliega la tarjeta: el clic de las pestañas no debe plegarla.
        <div role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div role="tablist" className="flex gap-1.5">
          {pestanas.filter((p) => p.activa).map((p) => (
            <span
              key={p.id}
              role="tab"
              tabIndex={0}
              aria-selected={activa === p.id}
              onClick={() => setVista(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVista(p.id) } }}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activa === p.id
                  ? 'border-transparent bg-sky-50 font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                  : 'bg-card text-texto-apagado hover:text-foreground'
              )}
            >
              {p.label}
            </span>
          ))}
        </div>
        </div>
      }
    >
      {activa === 'remanente'
        ? <RemanenteChart historial={historial} neu={neu} sinTarjeta />
        : <KilometrajeChart historial={historial} neu={neu} sinTarjeta />}
    </CollapsibleSection>
  )
}
