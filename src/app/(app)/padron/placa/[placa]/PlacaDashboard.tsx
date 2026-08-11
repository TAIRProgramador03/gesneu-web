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
        <Spinner className="size-8 text-sky-800" />
      </div>
    )
  }

  if (isError || !vehiculo?.PLACA) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-500">
          No se encontró el vehículo con placa <strong>{placa}</strong>.
        </p>
        <Link href="/padron" className="text-sky-800 hover:underline text-sm">
          Volver al padrón
        </Link>
      </div>
    )
  }

  const toGroupKey = (m: typeof historial[0]) => {
    const fecha = m.FECHA_MOVIMIENTO
      ? String(m.FECHA_MOVIMIENTO).substring(0, 10)
      : String(m.FECHA_REGISTRO_MOVIMIENTO).substring(0, 10)
    return `${fecha}_${m.ID_ACCION_REALIZADA}`
  }
  const totalMovimientos = new Set(historial.map(toGroupKey)).size
  const totalInspecciones = new Set(historial.filter(m => m.ID_ACCION_REALIZADA === 7).map(toGroupKey)).size
  const neumaticosUnicos = new Set(historial.map(m => m.CODIGO_NEUMATICO)).size

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

      {/* Hero */}
      <PlacaHeroHeader vehiculo={vehiculo} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Route className="size-5" />}
          label="Kilometraje actual"
          value={vehiculo.KILOMETRAJE_GESNEU !== null ? vehiculo.KILOMETRAJE_GESNEU.toLocaleString('es-PE') : vehiculo.KILOMETRAJE.toLocaleString('es-PE')}
          color="text-sky-800"
          border="border-sky-800"
        />
        <StatCard
          icon={<ArrowRightLeft className="size-5" />}
          label="Total movimientos"
          value={totalMovimientos}
          color="text-teal-600"
          border="border-teal-600"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Total inspecciones"
          value={totalInspecciones}
          color="text-indigo-600"
          border="border-indigo-600"
        />
        <StatCard
          icon={<CircleDot className="size-5" />}
          label="Neumáticos históricos"
          value={neumaticosUnicos}
          color="text-amber-600"
          border="border-amber-600"
        />
      </div>

      {/* Ficha + Neumáticos actuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <PlacaFichaTecnica vehiculo={vehiculo} />
        <NeumaticosActualesCard neumaticos={neumaticosActuales ?? []} />
      </div>

      {/* Timeline */}
      <PlacaTimeline movimientos={historial} />

      {/* Historial Table */}
      <CollapsibleSection title="Historial de Movimientos" icon={<ClipboardList className="size-4" />} border="border-sky-500">
        <DataTableNeumaticos
          columns={columnsHistorialPlaca}
          data={historial}
          type="pagination"
          filters
          withExport
          exportConfig={{ title: `GESNEU: HISTORIAL DE PLACA: ${placa}`, fileName: `HISTORIAL-MOVIMIENTOS-${placa}` }}
        />
      </CollapsibleSection>
    </div>
  )
}
