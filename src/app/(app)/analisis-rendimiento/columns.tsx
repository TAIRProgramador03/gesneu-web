"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { LinearProgressItem } from "@/components/ui/LinearProgress";
import Link from "next/link";
import { capitalizeCustomString, convertToDateHuman } from "@/lib/utils";
import { RelacionNeumaticoTerreno, ResponseRelacionDespachoDeNeumaticos } from "@/api/Neumaticos";
import { TipoTerrenoBadge } from "@/components/ui/TipoTerrenoBadge";
import { EsRecuperadoBadge } from "@/components/ui/EsRecuperadoBadge";
import { TipoMovimientoBadge } from "@/components/ui/TipoMovimientoBadge";

export const columnsRelacionNeumaticosPorTerreno: ColumnDef<RelacionNeumaticoTerreno>[] = [
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
    cell: ({ row }) => <Link target="_BLANK" href={`/padron/neumatico/${row.original.CODIGO_NEUMATICO}`}>{row.original.CODIGO_NEUMATICO}</Link>,
  },
  {
    accessorKey: "MARCA_NEUMATICO",
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
    accessorKey: "MEDIDA_NEUMATICO",
    meta: { exportLabel: "Medida" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "DISENO_NEUMATICO",
    meta: { exportLabel: "Diseño" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Diseño
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PROYECTO_NEUMATICO",
    meta: { exportLabel: "Taller" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Taller de Baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "COSTO_NEUMATICO",
    meta: { exportLabel: "Costo" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Costo ($)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "ES_RECUPERADO",
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
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.ES_RECUPERADO ?? false} />,
  },
  {
    accessorKey: "PLACA_BAJA",
    meta: { exportLabel: "Placa de Baja" },
    cell: ({ row }) => {
      if (!row.original.PLACA_BAJA) return '-'
      return <Link target="_BLANK" href={`/padron/placa/${row.original.PLACA_BAJA}`}>{row.original.PLACA_BAJA}</Link>
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Placa de Baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "KM_TOTAL_VIDA",
    meta: { exportLabel: "Kms recorridos" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kms recorridos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "TIPO_BAJA",
    meta: { exportLabel: "Tipo de Baja" },
    header: () => "Tipo de Baja",
    cell: ({ row }) => capitalizeCustomString(row.original.TIPO_BAJA),
  },
  {
    accessorKey: "FECHA_BAJA",
    meta: { exportLabel: "Fecha de baja" },
    cell: ({ row }) => row.original.FECHA_BAJA !== null ? convertToDateHuman(row.original.FECHA_BAJA) : '-',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha de baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "REMANENTE_ACTUAL",
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
    cell: ({ row }) => <LinearProgressItem estado={row.original.PORCENTAJE_VIDA ?? 0} width="120px" />,
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

export const columnsRelacionNeumaticosPorBaja: ColumnDef<RelacionNeumaticoTerreno>[] = [
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
    cell: ({ row }) => <Link target="_BLANK" href={`/padron/neumatico/${row.original.CODIGO_NEUMATICO}`}>{row.original.CODIGO_NEUMATICO}</Link>,
  },
  {
    accessorKey: "MARCA_NEUMATICO",
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
    accessorKey: "MEDIDA_NEUMATICO",
    meta: { exportLabel: "Medida" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "DISENO_NEUMATICO",
    meta: { exportLabel: "Diseño" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Diseño
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PROYECTO_NEUMATICO",
    meta: { exportLabel: "Taller" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Taller de Baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "COSTO_NEUMATICO",
    meta: { exportLabel: "Costo" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Costo ($)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "ES_RECUPERADO",
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
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.ES_RECUPERADO ?? false} />,
  },
  {
    accessorKey: "PLACA_BAJA",
    meta: { exportLabel: "Placa de Baja" },
    cell: ({ row }) => {
      if (!row.original.PLACA_BAJA) return '-'
      return <Link target="_BLANK" href={`/padron/placa/${row.original.PLACA_BAJA}`}>{row.original.PLACA_BAJA}</Link>
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Placa de Baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "KM_TOTAL_VIDA",
    meta: { exportLabel: "Kms recorridos" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kms recorridos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "FECHA_BAJA",
    meta: { exportLabel: "Fecha de baja" },
    cell: ({ row }) => row.original.FECHA_BAJA !== null ? convertToDateHuman(row.original.FECHA_BAJA) : '-',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha de baja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "REMANENTE_ACTUAL",
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
    cell: ({ row }) => <LinearProgressItem estado={row.original.PORCENTAJE_VIDA ?? 0} width="120px" />,
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


export const columnsRelacionNeumaticoDespachados: ColumnDef<ResponseRelacionDespachoDeNeumaticos>[] = [
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
    accessorKey: "VALE_SALIDA",
    meta: { exportLabel: "Vale de Salida" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Vale de Salida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "OT_SALIDA",
    meta: { exportLabel: "OT" },
    header: () => "OT",
  },
  {
    accessorKey: "TIPO_MANT_SALIDA",
    meta: { exportLabel: "Tipo de mantenimiento" },
    header: () => "Tipo de mantenimiento",
  },
  {
    accessorKey: "NUEVO_USADO_SALIDA",
    meta: { exportLabel: "Nuevo/Usado" },
    header: () => "Nuevo/Usado",
    cell: ({ row }) => capitalizeCustomString(row.original.NUEVO_USADO_SALIDA),
  },
  {
    accessorKey: "TALLER_SALIDA",
    meta: { exportLabel: "Taller de Salida" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Taller de Salida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "PLACA_SALIDA",
    meta: { exportLabel: "Placa de Salida" },
    cell: ({ row }) => {
      if (!row.original.PLACA_SALIDA) return '-'
      return <Link target="_BLANK" href={`/padron/placa/${row.original.PLACA_SALIDA}`}>{row.original.PLACA_SALIDA}</Link>
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Placa de Salida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "FECHA_SALIDA",
    meta: { exportLabel: "Fecha de Salida" },
    cell: ({ row }) => row.original.FECHA_SALIDA !== null ? convertToDateHuman(row.original.FECHA_SALIDA) : '-',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha de Salida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
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
    cell: ({ row }) => <Link target="_BLANK" href={`/padron/neumatico/${row.original.CODIGO}`}>{row.original.CODIGO}</Link>,
  },
  {
    accessorKey: "MARCA_NEUMATICO",
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
    accessorKey: "MEDIDA_NEUMATICO",
    meta: { exportLabel: "Medida" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "DISENO_NEUMATICO",
    meta: { exportLabel: "Diseño" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Diseño
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "TALLER_NEUMATICO",
    meta: { exportLabel: "Taller Actual" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Taller Actual
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "COSTO_NEUMATICO",
    meta: { exportLabel: "Costo" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Costo ($)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "RECUPERADO_NEUMATICO",
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
    cell: ({ row }) => <EsRecuperadoBadge esRecuperado={row.original.RECUPERADO_NEUMATICO ?? false} />,
  },
  {
    accessorKey: "PLACA_NEUMATICO",
    meta: { exportLabel: "Placa del Neumático" },
    cell: ({ row }) => {
      if (!row.original.PLACA_NEUMATICO) return '-'
      return <Link target="_BLANK" href={`/padron/placa/${row.original.PLACA_NEUMATICO}`}>{row.original.PLACA_NEUMATICO}</Link>
    },
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
    accessorKey: "SITUACION_NEUMATICO",
    meta: { exportLabel: "Situación" },
    cell: ({ row }) => < TipoMovimientoBadge tipoMovimiento={row.original.SITUACION_NEUMATICO} />,
    header: ({ column }) => "Situación",
  },
  {
    accessorKey: "KM_NEUMATICO",
    meta: { exportLabel: "Kms recorridos" },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kms recorridos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
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
    accessorKey: "VIDA_NEUMATICO",
    meta: { exportLabel: "Estado (%)" },
    cell: ({ row }) => <LinearProgressItem estado={row.original.VIDA_NEUMATICO ?? 0} width="120px" />,
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