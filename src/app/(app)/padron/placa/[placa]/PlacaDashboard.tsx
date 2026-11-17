'use client'

import React from 'react'
import Link from 'next/link'
import { usePlacaDetail } from '@/hooks/use-placa-detail'
import { Spinner } from '@/components/ui/spinner'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { PlacaHeroHeader } from '@/components/padron/placa/PlacaHeroHeader'
import { PlacaFichaTecnica } from '@/components/padron/placa/PlacaFichaTecnica'
import { NeumaticosActualesCard } from '@/components/padron/placa/NeumaticosActualesCard'
import { PlacaTimeline } from '@/components/padron/placa/PlacaTimeline'
import { EstadoInspeccionCard } from '@/components/padron/placa/EstadoInspeccionCard'
import { calcularEstadisticasPlaca } from '@/utils/estadisticas-placa'
import { StatCard } from '@/components/padron/neumatico/StatCard'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table'
import { columnsHistorialPlaca } from './columns-historial-placa'
import { ArrowRightLeft, CircleDot, ClipboardList, Route } from 'lucide-react'

export const PlacaDashboard = ({ placa }: { placa: string }) => {
  const { vehiculo, historial, neumaticosActuales, isLoading, isError } = usePlacaDetail({ placa })


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="size-8 text-sky-800 dark:text-sky-200" />
      </div>
    )
  }

  if (isError || !vehiculo?.PLACA) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-500 dark:text-slate-400">
          No se encontró el vehículo con placa <strong>{placa}</strong>.
        </p>
        <Link href="/padron" className="text-sky-800 dark:text-sky-200 hover:underline text-sm">
          Volver al padrón
        </Link>
      </div>
    )
  }

  const stats = calcularEstadisticasPlaca(neumaticosActuales ?? [], historial)
  const km = vehiculo.KILOMETRAJE_GESNEU !== null ? vehiculo.KILOMETRAJE_GESNEU : vehiculo.KILOMETRAJE
  // Si el padrón y GESNEU no coinciden se muestra el otro valor, para que la diferencia no pase inadvertida
  const kmOtro = vehiculo.KILOMETRAJE_GESNEU !== null && vehiculo.KILOMETRAJE !== vehiculo.KILOMETRAJE_GESNEU ? vehiculo.KILOMETRAJE : null
  const diasUltima = stats.ultimaInspeccion?.dias ?? null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/padron">Padrón</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Placa</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{placa}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PlacaHeroHeader vehiculo={vehiculo} stats={stats} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Route className="size-5" />}
          label="Kilometraje actual"
          value={km.toLocaleString('es-PE')}
          sub={kmOtro !== null ? `Padrón: ${kmOtro.toLocaleString('es-PE')} km` : undefined}
          color="text-sky-800 dark:text-sky-200"
          border="border-sky-800"
        />
        <StatCard
          icon={<ArrowRightLeft className="size-5" />}
          label="Total movimientos"
          value={stats.totalMovimientos}
          sub={stats.rotaciones > 0 ? `${stats.rotaciones} ${stats.rotaciones === 1 ? 'rotación' : 'rotaciones'}` : undefined}
          color="text-teal-600 dark:text-teal-300"
          border="border-teal-600"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Total inspecciones"
          value={stats.totalInspecciones}
          sub={diasUltima !== null ? (diasUltima === 0 ? 'Última hoy' : `Última hace ${diasUltima} d`) : undefined}
          color="text-indigo-600 dark:text-indigo-300"
          border="border-indigo-600"
        />
        <StatCard
          icon={<CircleDot className="size-5" />}
          label="Neumáticos históricos"
          value={stats.neumaticosHistoricos}
          sub={stats.dadosDeBaja > 0 ? `${stats.dadosDeBaja} ya dados de baja` : undefined}
          color="text-pink-600 dark:text-pink-300"
          border="border-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <NeumaticosActualesCard neumaticos={neumaticosActuales ?? []} cantidadNeumaticos={vehiculo.CANTIDAD_NEUMATICOS} />
          <PlacaTimeline movimientos={historial} />
          <CollapsibleSection title="Historial de Movimientos" icon={<ClipboardList className="size-4" />} defaultOpen={false} border="border-slate-400">
            <DataTableNeumaticos
              tarjetasEnMovil
              columns={columnsHistorialPlaca}
              data={historial}
              type="pagination"
              filters
              withExport
              exportConfig={{ title: `GESNEU: HISTORIAL DE PLACA: ${placa}`, fileName: `HISTORIAL-MOVIMIENTOS-${placa}` }}
            />
          </CollapsibleSection>
        </div>

        <div className="space-y-6 min-w-0">
          <EstadoInspeccionCard stats={stats} />
          <PlacaFichaTecnica vehiculo={vehiculo} />
        </div>
      </div>
    </div>
  )
}
