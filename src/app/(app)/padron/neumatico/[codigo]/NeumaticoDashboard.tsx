'use client'

import React from "react"
import Link from "next/link"
import { useNeumaticoDetail } from "@/hooks/use-neumatico-detail"
import { DataTableNeumaticos } from "@/components/ui/data-table/data-table"
import { Spinner } from "@/components/ui/spinner"
import { columnsHistorial } from "./columns-historial"
import { ClipboardList, ArrowRightLeft, Gauge, Route } from "lucide-react"
import { HeroHeader } from "@/components/padron/neumatico/HeroHeader"
import { CustomBreadcrumb } from "@/components/ui/CustomBreadcrumb"
import { StatCard } from "@/components/padron/neumatico/StatCard"
import { FichaTecnica } from "@/components/padron/neumatico/FichaTecnica"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"
import { VidaUtilCard } from "@/components/padron/neumatico/VidaUtilCard"
import { EvolucionCard } from "@/components/padron/neumatico/EvolucionCard"
import { UbicacionCard } from "@/components/padron/neumatico/UbicacionCard"
import { Timeline } from '@/components/padron/neumatico/Timeline'
import { usePlacaDetail } from "@/hooks/use-placa-detail"
import { calcularEstadisticasNeumatico } from "@/utils/estadisticas-neumatico"
import { diasDesdeFecha } from "@/lib/utils"

export const NeumaticoDashboard = ({ codigo }: { codigo: string }) => {
  const { neumatico, historial, isLoading, isError } = useNeumaticoDetail({ codigo })

  // Último vehículo donde estuvo: sirve para dibujar el diagrama aunque el neumático ya esté de baja.
  const ultimoConPlaca = [...historial].reverse().find((m) => m.PLACA_VEHICULO)
  const ultimaPlaca = neumatico?.PLACA_ACTUAL || ultimoConPlaca?.PLACA_VEHICULO || ''
  const { vehiculo, neumaticosActuales, isLoading: cargandoPlaca } = usePlacaDetail({ placa: ultimaPlaca })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="size-8 text-sky-800 dark:text-sky-200" />
      </div>
    )
  }

  if (isError || !neumatico) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-500 dark:text-slate-400">No se encontró el neumático con código <strong>{codigo}</strong>.</p>
        <Link href="/padron" className="text-sky-800 dark:text-sky-200 hover:underline text-sm">
          Volver al padrón
        </Link>
      </div>
    )
  }

  const stats = calcularEstadisticasNeumatico(neumatico, historial)
  const totalInspecciones = historial.filter(movimiento => movimiento.ACCION_REALIZADA === "INSPECCION RUTINARIA").length
  // Posición actual: sólo si sigue montado en esa placa
  const posicion = neumatico.PLACA_ACTUAL
    ? neumaticosActuales.find((n) => n.CODIGO_NEU === neumatico.CODIGO_NEUMATICO)?.POSICION_NEU ?? null
    : null
  // Última posición conocida: la que dejó en su último movimiento con vehículo
  const ultimaPosicion = ultimoConPlaca
    ? (ultimoConPlaca.POSICION_ANTERIOR_EN_VEHICULO || ultimoConPlaca.POSICION_NUEVA_EN_VEHICULO || null)
    : null
  const ultimoMov = historial.length > 0 ? historial[historial.length - 1] : undefined

  const ultimaInspeccion = [...historial].reverse().find((m) => m.ID_ACCION_REALIZADA === 7)
  const diasUltima = ultimaInspeccion ? diasDesdeFecha(ultimaInspeccion.FECHA_MOVIMIENTO) : null
  const rotaciones = historial.filter((m) => m.ID_ACCION_REALIZADA === 4).length

  return (
    <div className="space-y-6">
      <CustomBreadcrumb codigo={codigo} />

      <HeroHeader
        neu={neumatico}
        stats={stats}
        posicion={posicion}
        ultimaPlaca={ultimaPlaca}
        ultimaPosicion={ultimaPosicion}
        ultimoMov={ultimoMov}
      />

      {/* Cuatro datos de contexto; la vida útil ya la muestra el hero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Gauge className="size-5" />}
          label="Remanente actual"
          value={`${neumatico.REMANENTE_ACTUAL} mm`}
          sub={stats.mmDesgastados > 0 ? `−${stats.mmDesgastados.toFixed(1)} mm desde el montaje` : undefined}
          color="text-sky-800 dark:text-sky-200"
          border="border-sky-800"
        />
        <StatCard
          icon={<Route className="size-5" />}
          label="Km recorridos"
          value={stats.kmTotal > 0 ? stats.kmTotal.toLocaleString("es-PE") : "—"}
          sub={stats.diasDeRecorrido > 0 ? `en ${stats.diasDeRecorrido} días de servicio` : undefined}
          color="text-teal-600 dark:text-teal-300"
          border="border-teal-600"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Inspecciones"
          value={totalInspecciones}
          sub={diasUltima !== null ? (diasUltima === 0 ? "Última hoy" : `Última hace ${diasUltima} d`) : undefined}
          color="text-indigo-600 dark:text-indigo-300"
          border="border-indigo-600"
        />
        <StatCard
          icon={<ArrowRightLeft className="size-5" />}
          label="Movimientos"
          value={historial.length}
          sub={rotaciones > 0 ? `${rotaciones} ${rotaciones === 1 ? "rotación" : "rotaciones"}` : undefined}
          color="text-pink-600 dark:text-pink-300"
          border="border-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <VidaUtilCard neu={neumatico} stats={stats} />
          <EvolucionCard historial={historial} neu={neumatico} />
          <Timeline movimientos={[...historial].reverse()} />
          <CollapsibleSection title="Historial de Movimientos" icon={<ClipboardList className="size-4" />} defaultOpen={false} border="border-slate-400">
            <DataTableNeumaticos
              tarjetasEnMovil
              columns={columnsHistorial}
              data={[...historial].reverse()}
              type="pagination"
              filters
              withExport
              exportConfig={{ title: `GESNEU: HISTORIAL DEL NEUMÁTICO: ${codigo}`, fileName: `HISTORIAL-MOVIMIENTOS-${codigo}` }}
            />
          </CollapsibleSection>
        </div>

        <div className="space-y-6 min-w-0">
          <UbicacionCard
            neu={neumatico}
            posicion={posicion}
            ultimaPlaca={ultimaPlaca}
            ultimaPosicion={ultimaPosicion}
            vehiculo={vehiculo}
            neumaticosActuales={neumaticosActuales}
            cargando={cargandoPlaca}
          />
          <FichaTecnica neu={neumatico} />
        </div>
      </div>
    </div>
  )
}
