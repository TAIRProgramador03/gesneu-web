'use client'

import React from "react"
import Link from "next/link"
import { useNeumaticoDetail } from "@/hooks/use-neumatico-detail"
import { DataTableNeumaticos } from "@/components/ui/data-table/data-table"
import { Spinner } from "@/components/ui/spinner"
import { columnsHistorial } from "./columns-historial"
import {
  Gauge,
  Route,
  ClipboardList,
  ArrowRightLeft
} from "lucide-react"
import { HeroHeader } from "@/components/padron/neumatico/HeroHeader"
import { borderColor, vidaColor } from "@/utils/helpers"
import { CustomBreadcrumb } from "@/components/ui/CustomBreadcrumb"
import { StatCard } from "@/components/padron/neumatico/StatCard"
import { FichaTecnica } from "@/components/padron/neumatico/FichaTecnica"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"
import { VidaUtilCard } from "@/components/padron/neumatico/VidaUtilCard"
import { RemanenteChart } from "@/components/padron/neumatico/RemanenteChart"
import { Timeline } from '../../../../components/padron/neumatico/Timeline';

export const NeumaticoDashboard = ({ codigo }: { codigo: string }) => {
  const { neumatico, historial, isLoading, isError } = useNeumaticoDetail({ codigo })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="size-8 text-sky-800" />
      </div>
    )
  }

  if (isError || !neumatico) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-500">No se encontró el neumático con código <strong>{codigo}</strong>.</p>
        <Link href="/padron" className="text-sky-800 hover:underline text-sm">
          Volver al padrón
        </Link>
      </div>
    )
  }

  const pctVida = neumatico.PORCENTAJE_VIDA ?? 0
  const totalInspecciones = historial.filter(movimiento => movimiento.ACCION_REALIZADA === "INSPECCION RUTINARIA").length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <CustomBreadcrumb codigo={codigo} />

      {/* Hero */}
      <HeroHeader neu={neumatico} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Gauge className="size-5" />}
          label="Vida útil"
          value={`${pctVida}%`}
          color={vidaColor(pctVida)}
          border={borderColor(pctVida)}
        />
        <StatCard
          icon={<Route className="size-5" />}
          label="Remanente actual"
          value={`${neumatico.REMANENTE_ACTUAL} mm`}
          color="text-sky-800"
          border={"border-sky-800"}
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Total inspecciones"
          value={totalInspecciones}
          color="text-indigo-600"
          border={"border-indigo-600"}
        />
        <StatCard
          icon={<ArrowRightLeft className="size-5" />}
          label="Total movimientos"
          value={historial.length}
          color="text-teal-600"
          border={"border-teal-600"}
        />
      </div>

      {/* Mid row: Ficha Técnica + Vida Útil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <FichaTecnica neu={neumatico} />
        <VidaUtilCard neu={neumatico} historial={historial} />
      </div>

      {/* Remanente Chart */}
      <RemanenteChart historial={historial} neu={neumatico} />

      {/* Timeline */}
      <Timeline movimientos={[...historial].reverse()} />

      {/* Historial Table */}
      <CollapsibleSection title="Historial de Movimientos" icon={<ClipboardList className="size-4" />} border="border-sky-500">
        <DataTableNeumaticos
          columns={columnsHistorial}
          data={[...historial].reverse()}
          type="pagination"
          filters
          withExport
          exportConfig={{ title: `GESNEU: HISTORIAL DEL NEUMÁTICO: ${codigo}`, fileName: `HISTORIAL-MOVIMIENTOS-${codigo}` }}
        />
      </CollapsibleSection>
    </div>
  )
}
