import React from "react"
import { PlacasConNeumaticos } from "@/api/Neumaticos"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

const getBadgeColor = (cantidad: number) => {
  if (cantidad === 0) return 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500'
  if (cantidad === 2) return 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500'
  if (cantidad === 7) return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500'
  if (cantidad === 5) return 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500'
  return 'bg-gray-100 dark:bg-superficie-2 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600'
}

export const columnsPlacasNeumaticos: ColumnDef<PlacasConNeumaticos>[] = [
  {
    id: "numero",
    header: "#",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "PLACA",
    meta: { exportLabel: "Placa" },
    cell: ({ row }) => <Link href={`/padron/placa/${row.original.PLACA}`} target="_blank">{row.original.PLACA}</Link>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Placa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "MARCA",
    meta: { exportLabel: "Marca" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Marca
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "MODELO",
    meta: { exportLabel: "Modelo" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Modelo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "CANTIDAD_NEUMATICOS_INSTALADOS",
    meta: { exportLabel: "Cantidad de Neumáticos" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cantidad de Neumáticos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cantidad = row.original.CANTIDAD_NEUMATICOS_INSTALADOS as number
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(cantidad)}`}>
          {cantidad}
        </span>
      )
    },
  }
]
