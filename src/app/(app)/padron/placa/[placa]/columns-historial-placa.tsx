'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { convertToDateHuman } from '@/lib/utils'
import { NeumaticoDelHistorial } from '@/api/Neumaticos'
import Link from 'next/link'

const AccionBadge = ({ tipo, text }: { tipo: number; text: string }) => (
  <span className={`px-3 py-0.5 rounded-md font-medium text-xs ${tipo === 2 ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' :
    tipo === 4 ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' :
      tipo === 5 ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
        tipo === 6 ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' :
          tipo === 7 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
            'bg-gray-100 dark:bg-superficie-2 text-gray-700 dark:text-slate-200'
    }`}>
    {text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : '—'}
  </span>
)

export const columnsHistorialPlaca: ColumnDef<NeumaticoDelHistorial>[] = [
  {
    accessorKey: 'FECHA_MOVIMIENTO',
    header: 'Fecha',
    cell: ({ row }) => {
      const val = row.getValue<string>('FECHA_MOVIMIENTO')
      return val ? convertToDateHuman(val) : '—'
    },
  },
  {
    accessorKey: 'CODIGO_NEUMATICO',
    header: 'Neumático',
    cell: ({ row }) => <Link href={`/padron/neumatico/${row.original.CODIGO_NEUMATICO}`} target="_blank">{row.original.CODIGO_NEUMATICO}</Link>
  },
  {
    accessorKey: 'ACCION_REALIZADA',
    header: 'Movimiento',
    cell: ({ row }) => (
      <AccionBadge tipo={row.original.ID_ACCION_REALIZADA} text={row.original.ACCION_REALIZADA} />
    ),
  },
  {
    accessorKey: 'POSICION_ANTERIOR_EN_VEHICULO',
    header: 'Pos. anterior',
    cell: ({ row }) => row.original.POSICION_ANTERIOR_EN_VEHICULO || '—',
  },
  {
    accessorKey: 'POSICION_NUEVA_EN_VEHICULO',
    header: 'Pos. nueva',
    cell: ({ row }) => row.original.POSICION_NUEVA_EN_VEHICULO || '—',
  },
  {
    accessorKey: 'PRESION_AIRE_PSI',
    header: 'Presión',
    cell: ({ row }) => {
      const val = row.getValue<number>('PRESION_AIRE_PSI')
      return val !== null ? `${val}` : '—'
    },
  },
  {
    accessorKey: 'TORQUE_APLICADO_NM',
    header: 'Torque',
    cell: ({ row }) => {
      const val = row.getValue<number>('TORQUE_APLICADO_NM')
      return val !== null ? `${val}` : '—'
    },
  },
  {
    accessorKey: 'REMANENTE_MEDIDO_MM',
    header: 'Remanente',
    cell: ({ row }) => {
      const val = row.getValue<number>('REMANENTE_MEDIDO_MM')
      return val !== null ? `${val}` : '—'
    },
  },
  {
    accessorKey: 'PORCENTAJE_VIDA_UTIL',
    header: 'Vida útil',
    cell: ({ row }) => {
      const val = row.getValue<number>('PORCENTAJE_VIDA_UTIL')
      if (val === null) return '—'
      return (
        <span className={`text-xs font-semibold ${val < 39 ? 'text-red-600 dark:text-red-300' :
          val < 79 ? 'text-amber-600 dark:text-amber-300' :
            'text-green-600 dark:text-green-300'
          }`}>
          {val}%
        </span>
      )
    },
  },
  {
    accessorKey: 'KM_RECORRIDOS_EN_ETAPA',
    header: 'Km etapa',
    cell: ({ row }) => {
      const val = row.getValue<number>('KM_RECORRIDOS_EN_ETAPA')
      return val !== null ? val.toLocaleString('es-PE') : '—'
    },
  },
  {
    accessorKey: 'TALLER_ASIGNADO',
    header: 'Taller',
    cell: ({ row }) => row.getValue('TALLER_ASIGNADO') || '—',
  },
  {
    accessorKey: 'USUARIO_REGISTRADOR',
    header: 'Usuario',
    cell: ({ row }) => (row.original.USUARIO_REGISTRADOR || '').trim() || '—',
  },
  {
    accessorKey: 'OBSERVACION',
    header: 'Observación',
    cell: ({ row }) => (row.original.OBSERVACION || '').trim() || '—',
  },
]
