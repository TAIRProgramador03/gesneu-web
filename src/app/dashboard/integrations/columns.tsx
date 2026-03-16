"use client"

import React from "react"
import { EsRecuperadoBadge } from "@/components/ui/EsRecuperadoBadge"
import { ColumnDef } from "@tanstack/react-table"
import { LinearProgressItem } from "@/components/ui/LinearProgress"
import { convertToDateHuman } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DraggableNeumatico } from "@/components/dashboard/integrations/modal-asignacion-neu"
import type { Neumatico } from "@/types/types"
import { TipoMovimientoBadge } from "@/components/ui/TipoMovimientoBadge"
import { NeuAsignadoTable, NeuAsignarTable, NeuDisponibleTable, NeuTemporalTable } from "@/types/neumatico"


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
    accessorKey: "FECHA_FABRICACION_COD",
    header: "Fecha",
  },
  {
    accessorKey: "RECUPERADO",
    header: "Recuperado",
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
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} />
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
    header: "Código",
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
    header: "Remanente",
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
    header: "Recuperado",
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO ?? false} />,
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
    cell: ({ row }) => convertToDateHuman(row.original.CODIGO ?? '-')
  },
  {
    accessorKey: "MARCA",
    header: "Marca",
    cell: ({ row }) => convertToDateHuman(row.original.MARCA ?? '-'),
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
