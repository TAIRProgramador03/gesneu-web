import React from "react"
import { PlacasConNeumaticos } from "@/api/Neumaticos"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

const getBadgeColor = (cantidad: number) => {
  if (cantidad === 0) return 'bg-red-100 text-red-700 border border-red-500'
  if (cantidad === 5) return 'bg-cyan-100 text-cyan-700 border border-cyan-500'
  return 'bg-gray-100 text-gray-700 border border-gray-300'
}

export const columnsPlacasNeumaticos: ColumnDef<PlacasConNeumaticos>[] = [
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
