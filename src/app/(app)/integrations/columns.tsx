"use client"

import React from "react"
import { EsRecuperadoBadge } from "@/components/ui/EsRecuperadoBadge"
import { ColumnDef } from "@tanstack/react-table"
import { LinearProgressItem } from "@/components/ui/LinearProgress"
import { convertToDateHuman } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowBigRightDash, ArrowUpDown } from "lucide-react"
import { DraggableNeumatico } from "@/components/dashboard/integrations/modal-asignacion-neu"
import type { Neumatico } from "@/types/types"
import { TipoMovimientoBadge } from "@/components/ui/TipoMovimientoBadge"
import { NeuAsignadoTable, NeuAsignarTable, NeuDisponibleTable, NeuInspeccionTable, NeumaticoPorAsignar, NeumaticoPorInspeccionar, NeumaticoReubicar, NeuTemporalTable } from "@/types/neumatico"
import { InspeccionTable } from "@/types/inspecciones"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TipoTerrenoBadge } from "@/components/ui/TipoTerrenoBadge"
import { TipoRetenBadge } from "@/components/ui/TipoRetenBadge"
import Link from "next/link"


export const columnsNeuDisponible: ColumnDef<NeuDisponibleTable>[] = [
  {
    accessorKey: "CODIGO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank">{row.original.CODIGO}</Link>
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
  },
  {
    accessorKey: "MEDIDA",
    header: "Medida",
  },
  {
    accessorKey: "DISEÑO",
    header: "Diseño",
  },
  {
    accessorKey: "FECHA_FABRICACION_COD",
    header: "F. fabricación",
    cell: ({ row }) => row.original.FECHA_FABRICACION_COD ?? '-',
  },
  {
    accessorKey: "RECUPERADO",
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recuperado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "REMANENTE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "ESTADO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} width="120px" />
  },
]

export const columnsNeuAsignado: ColumnDef<NeuAsignadoTable>[] = [
  {
    accessorKey: "POSICION_NEU",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Posición
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "CODIGO",
    header: "Código",
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank">{row.original.CODIGO}</Link>
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
  },
  {
    accessorKey: "DISENO",
    header: "Diseño",
  },
  {
    accessorKey: "MEDIDA",
    header: "Medida",
  },
  {
    accessorKey: "FECHA_ASIGNACION",
    header: "Fecha de asig.",
    cell: ({ row }) => convertToDateHuman(row.original.FECHA_ASIGNACION)
  },
  {
    accessorKey: "FECHA_ULTIMO_SUCESO",
    header: "Fecha de reg.",
    cell: ({ row }) => convertToDateHuman(row.original.FECHA_ULTIMO_SUCESO)
  },
  {
    accessorKey: "RECUPERADO",
    header: "Recuperado",
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
  },
  {
    accessorKey: "PRESION_AIRE",
    header: "Presión",
  },
  {
    accessorKey: "TORQUE_APLICADO",
    header: "Torque",
  },
  {
    accessorKey: "REMANENTE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "ESTADO",
    // header: "Estado",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} />
  },
]

export const columnsNeuParaAsignar: ColumnDef<NeuAsignarTable>[] = [
  {
    accessorKey: "DRAWABLE",
    header: "Neumático",
    cell: ({ row }) => {
      return (
        <DraggableNeumatico
          neumatico={row.original as unknown as Neumatico}
          disabled={false}
        />
      )
    },
  },
  {
    accessorKey: "CODIGO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank">{row.original.CODIGO}</Link>
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
  },
  {
    accessorKey: "DISEÑO",
    header: "Diseño",
  },
  {
    accessorKey: "REMANENTE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "MEDIDA",
    header: "Medida",
  },
  {
    accessorKey: "FECHA_REGISTRO",
    header: "Envio",
    cell: ({ row }) => convertToDateHuman(row.original.FECHA_REGISTRO)
  },
  {
    accessorKey: "RECUPERADO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recuperado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
  },
  {
    accessorKey: "ESTADO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} width="100px" />
  },
]

export const columnsNeuParaAsignarDesdeDesasignar: ColumnDef<NeuAsignarTable>[] = [
  {
    accessorKey: "DRAWABLE",
    header: "Neumático",
    cell: ({ row }) => {
      return (
        <DraggableNeumatico
          neumatico={row.original as unknown as Neumatico}
          disabled={false}
        />
      )
    },
  },
  {
    accessorKey: "CODIGO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank">{row.original.CODIGO}</Link>
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
  },
  {
    accessorKey: "DISEÑO",
    header: "Diseño",
  },
  {
    accessorKey: "REMANENTE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rm
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "MEDIDA",
    header: "Medida",
  },
  {
    accessorKey: "FECHA_REGISTRO",
    header: "Envio",
    cell: ({ row }) => convertToDateHuman(row.original.FECHA_REGISTRO)
  },
  {
    accessorKey: "RECUPERADO",
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recuperado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "TIPO_MOVIMIENTO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Situación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <TipoMovimientoBadge tipoMovimiento={row.original.TIPO_MOVIMIENTO ?? ''} />,
  },
  {
    accessorKey: "ESTADO",
    // header: "Estado",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} width="100px" />
  },
]

export const columnsNeuTemporales: ColumnDef<NeuTemporalTable>[] = [
  {
    accessorKey: "POSICION_NEU",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Posición
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "CODIGO",
    header: "Código",
    cell: ({ row }) => row.original.CODIGO ?? '-'
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
    cell: ({ row }) => row.original.MARCA ?? '-'
  },
  {
    accessorKey: "FECHA_ASIGNACION",
    header: "Fecha Asig.",
    cell: ({ row }) => convertToDateHuman(row.original.FECHA_ASIGNACION ?? '-')
  },
  {
    accessorKey: "TIPO_MOVIMIENTO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Situación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <TipoMovimientoBadge tipoMovimiento={row.original.TIPO_MOVIMIENTO ?? 'VACIO'} />
  },
]


export const columnsInspecciones = (
  onViewMore: (row: InspeccionTable) => void
)
  : ColumnDef<InspeccionTable>[] => [
    {
      accessorKey: "FECHA_INSPECCION",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha de inspección
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => convertToDateHuman(row.original.FECHA_INSPECCION ?? '-')
    },
    {
      accessorKey: "KILOMETRAJE",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Km
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "TIPO_TERRENO",
      header: 'Terreno',
      cell: ({ row }) => <TipoTerrenoBadge tipo={row.original.TIPO_TERRENO} />
    },
    {
      accessorKey: "RETEN",
      header: 'Condición',
      cell: ({ row }) => <TipoRetenBadge tipo={row.original.RETEN} />
    },
    {
      accessorKey: "FECHA_TIEMPO",
      header: 'F. Registro',
      cell: ({ row }) => convertToDateHuman(row.original.FECHA_TIEMPO)
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <span
            className="cursor-pointer text-cyan-500"
          >
            <ArrowBigRightDash radius={20}
              onClick={() => onViewMore(row.original)}
            />
          </span>
        )
      },
    },
  ]



export const columnsNeuInspeccion: ColumnDef<NeuInspeccionTable>[] = [
  {
    accessorKey: "CODIGO",
    header: "Código",
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO}`} target="_blank">{row.original.CODIGO}</Link>
  },
  {
    accessorKey: "POSICION",
    header: "Posición",
  },
  {
    accessorKey: "KM_RECORRIDO",
    header: "Km x etapa",
  },
  {
    accessorKey: "OBS",
    header: "Observación",
    cell: ({ row }) => {
      const obs = row.original.OBS
      let newObs = ''

      if (obs.length === 0) newObs = '-'
      else if (obs.length >= 8) {
        newObs = obs.slice(0, 8) + '...'
      } else {
        newObs = obs
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs">
              {newObs}
            </span>
          </TooltipTrigger>
          {
            obs.length >= 8 ? (
              <TooltipContent>
                <p>{obs}</p>
              </TooltipContent>
            ) : null
          }
        </Tooltip>
      )
    }
  },
  {
    accessorKey: "REMANENTE",
    header: "Remanente",
  },
  {
    accessorKey: "PORCENTAJE_VIDA",
    header: "Estado (%)",
    cell: ({ row }) => <LinearProgressItem estado={row.original.PORCENTAJE_VIDA ?? 0} width="120px" />
  },
]


export const columnsNeuPorAsignar: ColumnDef<NeumaticoPorAsignar>[] = [
  {
    accessorKey: "Posicion",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Posición
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "CodigoNeumatico",
    header: "Código",
  },
  {
    accessorKey: "Marca",
    header: "Marca",
  },
  {
    accessorKey: "Remanente",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PresionAire",
    header: "Presión",
  },
  {
    accessorKey: "TorqueAplicado",
    header: "Torque",
  },
  {
    accessorKey: "FechaAsignacion",
    header: "Fecha de asignación",
    cell: ({ row }) => convertToDateHuman(row.original.FechaAsignacion)
  },

]

export const columnsNeuPorInspeccionar: ColumnDef<NeumaticoPorInspeccionar>[] = [
  {
    accessorKey: "Posicion",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Posición
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "CodigoNeumatico",
    header: "Código",
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CodigoNeumatico}`} target="_blank">{row.original.CodigoNeumatico}</Link>
  },
  {
    accessorKey: "Marca",
    header: "Marca",
  },
  {
    accessorKey: "Medida",
    header: "Medida",
  },
  {
    accessorKey: "Remanente",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente inspección (ahora)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "RemanenteReferencia",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente anterior
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PresionAire",
    header: "Presión",
  },
  {
    accessorKey: "TorqueAplicado",
    header: "Torque",
  },
]


export const columnsNeuPorReubicar: ColumnDef<NeumaticoReubicar>[] = [
  {
    accessorKey: "CodigoNeumatico",
    header: "Código",
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CodigoNeumatico}`} target="_blank">{row.original.CodigoNeumatico}</Link>
  },
  {
    accessorKey: "PosicionOrigen",
    header: "Posición origen",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
        {row.original.PosicionOrigen}
      </span>
    ),
  },
  {
    accessorKey: "PosicionDestino",
    header: "Posición destino",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-300">
        {row.original.PosicionDestino}
      </span>
    ),
  },
  {
    accessorKey: "Marca",
    header: "Marca",
  },
  {
    accessorKey: "Medida",
    header: "Medida",
  },
  {
    accessorKey: "Remanente",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remanente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PresionAire",
    header: "Presión",
  },
  {
    accessorKey: "TorqueAplicado",
    header: "Torque",
  },
]