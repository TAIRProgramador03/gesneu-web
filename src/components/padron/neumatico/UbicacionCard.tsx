'use client'

import { NeumaticoBuscado } from '@/api/Neumaticos'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import type { NeumaticoInstalado, VehiculoMain } from '@/hooks/use-placa-detail'
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

/**
 * Dónde está montado este neumático. Usa el mismo DiagramaVehiculo de /integrations,
 * así la silueta (moto, auto, camión) sale de la configuración y no se dibuja a mano.
 * Montado: muestra todos los neumáticos de la placa y resalta el de esta página.
 * Sin montar (baja, disponible): muestra el último vehículo donde estuvo con sólo este neumático.
 */
export const UbicacionCard = ({
  neu,
  posicion,
  ultimaPlaca,
  ultimaPosicion,
  vehiculo,
  neumaticosActuales,
  cargando,
}: {
  neu: NeumaticoBuscado
  posicion: string | null
  ultimaPlaca?: string
  ultimaPosicion?: string | null
  vehiculo?: VehiculoMain | null
  neumaticosActuales: NeumaticoInstalado[]
  cargando: boolean
}) => {
  const montado = !!neu.PLACA_ACTUAL
  const placa = neu.PLACA_ACTUAL || ultimaPlaca
  const pos = posicion ?? ultimaPosicion ?? null
  // Sin cantidad de neumáticos no se sabe qué silueta dibujar: se muestra sólo el texto.
  const cantidad = vehiculo?.CANTIDAD_NEUMATICOS

  // Sin montar, el vehículo ya tiene otros neumáticos: se dibuja sólo éste en su última posición.
  const neumaticosDiagrama = montado || !pos
    ? neumaticosActuales
    : [{
      POSICION: pos,
      POSICION_NEU: pos,
      CODIGO_NEU: neu.CODIGO_NEUMATICO,
      REMANENTE: neu.REMANENTE_ACTUAL,
      REMANENTE_ORIGINAL: neu.REMANENTE_ORIGINAL,
      ESTADO: neu.PORCENTAJE_VIDA,
      TIPO_MOVIMIENTO: neu.SITUACION_NEUMATICO,
    }]

  return (
    <CollapsibleSection
      title={montado ? 'Ubicación actual' : 'Último vehículo'}
      icon={<MapPin className="size-4" />}
      border="border-cyan-500"
    >
      {!placa ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center text-texto-apagado">
          <MapPin className="size-9 opacity-25" />
          <p className="text-sm font-medium">Nunca fue montado en un vehículo</p>
          <p className="text-xs">Situación: {neu.SITUACION_NEUMATICO || '—'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-texto-apagado">{montado ? 'Montado en' : 'Estuvo en'}</p>
              <p className="text-2xl font-extrabold leading-tight">{pos ?? '—'}</p>
            </div>
            <Link href={`/padron/placa/${placa}`} className="text-sm font-semibold text-primary hover:underline">
              {placa}
            </Link>
          </div>

          {cargando ? (
            <div className="mx-auto h-56 w-40 animate-pulse rounded-xl bg-superficie-1" />
          ) : cantidad && pos ? (
            <div className="flex justify-center overflow-hidden">
              <DiagramaVehiculo
                layout="dashboard"
                etiquetaDatos="remanente"
                anchoMax={190}
                cantidadNeumaticos={cantidad}
                neumaticosAsignados={neumaticosDiagrama}
                posicionResaltada={pos}
              />
            </div>
          ) : (
            <p className="rounded-lg bg-superficie-1 px-3 py-2 text-xs text-texto-apagado">
              No se pudo determinar la configuración del vehículo para dibujar el diagrama.
            </p>
          )}
          {!montado && (
            <p className="text-center text-xs text-texto-apagado">Última ubicación conocida; el neumático ya no está montado.</p>
          )}
        </div>
      )}
    </CollapsibleSection>
  )
}
