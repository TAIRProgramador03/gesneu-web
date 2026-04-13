"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { EsRecuperadoBadge } from "@/components/ui/EsRecuperadoBadge";
import { TipoMovimientoBadge } from "@/components/ui/TipoMovimientoBadge";
import { LinearProgressItem } from "@/components/ui/LinearProgress";
import { PadronExcel } from "@/types/padron";

export const columnsPadron: ColumnDef<PadronExcel>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "CODIGO",
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
  },
  {
    accessorKey: "MARCA",
    meta: { exportLabel: "Marca" },
    header: "Marca",
  },
  {
    accessorKey: "MEDIDA",
    meta: { exportLabel: "Medida" },
    header: "Medida",
  },
  {
    accessorKey: "DISEÑO",
    meta: { exportLabel: "Diseño" },
    header: "Diseño",
  },
  {
    accessorKey: "REMANENTE",
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
    accessorKey: "PR",
    meta: { exportLabel: "PR" },
    header: "PR",
  },
  {
    accessorKey: "CARGA",
    meta: { exportLabel: "Carga" },
    header: "Carga",
  },
  {
    accessorKey: "VELOCIDAD",
    meta: { exportLabel: "Velocidad" },
    header: "Velocidad",
  },
  {
    accessorKey: "RQ",
    meta: { exportLabel: "RQ" },
    cell: ({ row }) => row.original.RQ ? row.original.RQ : '-',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RQ
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "OC",
    meta: { exportLabel: "OC" },
    cell: ({ row }) => row.original.OC ? row.original.OC : '-',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          OC
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "LEASING",
    meta: { exportLabel: "Leasing" },
    header: "Leasing",
    cell: ({ row }) => row.original.LEASING ? row.original.LEASING : '-',
  },
  {
    accessorKey: "PROYECTO",
    meta: { exportLabel: "Taller" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Taller
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "COSTO",
    meta: { exportLabel: "Costo" },
    header: "Costo ($)",
  },
  {
    accessorKey: "PROVEEDOR",
    meta: { exportLabel: "Proveedor" },
    header: "Proveedor",
  },
  {
    accessorKey: "FECHA_FABRICACION_COD",
    cell: ({ row }) => row.original.FECHA_FABRICACION_COD ? row.original.FECHA_FABRICACION_COD : '-',
    meta: { exportLabel: "Fecha Fabricación" },
    header: "Fecha fabricación",
  },
  {
    accessorKey: "RECUPERADO",
    meta: { exportLabel: "Recuperado", exportValue: (v: boolean) => v ? "SI" : "NO" },
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
    accessorKey: "TIPO_MOVIMIENTO",
    meta: { exportLabel: "Situación" },
    cell: ({ row }) => < TipoMovimientoBadge tipoMovimiento={row.original.TIPO_MOVIMIENTO} />,
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
  },
  {
    accessorKey: "PLACA",
    meta: { exportLabel: "Placa" },
    cell: ({ row }) => row.original.PLACA ?? '-',
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
    accessorKey: "ESTADO",
    meta: { exportLabel: "Estado (%)" },
    cell: ({ row }) => <LinearProgressItem estado={row.original.ESTADO ?? 0} />,
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
  },
];