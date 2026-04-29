import React from "react"
import { NeumaticoEnCritico } from "@/api/Neumaticos"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { LinearProgressItem } from "@/components/ui/LinearProgress"
import Link from "next/link"

export const columnsNeuCriticos: ColumnDef<NeumaticoEnCritico>[] = [
  {
    accessorKey: "CODIGO_NEUMATICO",
    meta: { exportLabel: "Código" },
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
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO_NEUMATICO}`}>{row.original.CODIGO_NEUMATICO}</Link>
  },
  {
    accessorKey: "MARCA_NEUMATICO",
    meta: { exportLabel: "Marca" },
    header: "Marca",
  },
  {
    accessorKey: "MEDIDA_NEUMATICO",
    meta: { exportLabel: "Medida" },
    header: "Medida",
  },
  {
    accessorKey: "DISENO_NEUMATICO",
    meta: { exportLabel: "Diseño" },
    header: "Diseño",
  },
  {
    accessorKey: "PRESION_NEUMATICO",
    meta: { exportLabel: "Presión" },
    header: "Presión",
  },
  {
    accessorKey: "TORQUE_NEUMATICO",
    meta: { exportLabel: "Torque" },
    header: "Torque",
  },
  {
    accessorKey: "PLACA_VEHICULO",
    meta: { exportLabel: "Placa" },
    header: "Placa",
  },
  {
    accessorKey: "REMANENTE_NEUMATICO",
    meta: { exportLabel: "Remanente" },
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
    accessorKey: "PORCENTAJE_VIDA",
    meta: { exportLabel: "Estado (%)" },
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
    cell: ({ row }) => <LinearProgressItem estado={row.original.PORCENTAJE_VIDA ?? 0} />
  },
]