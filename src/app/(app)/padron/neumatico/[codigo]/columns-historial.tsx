'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { convertToDateHuman } from '@/lib/utils'
import type { MovimientoHistorial } from '@/hooks/use-neumatico-detail'
import Link from 'next/link'

const TipoMovimientoBadgeNew = ({ tipo = 0, text = '' }: { tipo: number, text: string }) => {
  return (
    <span className={`px-6 py-0.5 rounded-md  font-medium text-xs ${tipo === 2 ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' :
      tipo === 4 ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' :
        tipo === 5 ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
          tipo === 6 ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' :
            tipo === 7 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
              'bg-gray-100 dark:bg-superficie-2 text-gray-700 dark:text-slate-200'
      }`}>
      {
        tipo
          ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : ''
      }
    </span>
  )
}

export const columnsHistorial: ColumnDef<MovimientoHistorial>[] = [
  {
    accessorKey: 'FECHA_MOVIMIENTO',
    header: 'Fecha Movimiento',
    cell: ({ row }) => convertToDateHuman(row.getValue('FECHA_MOVIMIENTO')),
  },
  {
    accessorKey: 'ACCION_REALIZADA',
    header: 'Movimiento',
    cell: ({ row }) => (
      <TipoMovimientoBadgeNew tipo={row.original.ID_ACCION_REALIZADA} text={row.original.ACCION_REALIZADA} />
    ),
  },
  {
    accessorKey: 'PLACA_VEHICULO',
    header: 'Placa',
    cell: ({ row }) => row.original.PLACA_VEHICULO ? <Link href={`/padron/placa/${row.original.PLACA_VEHICULO}`} target="_blank">{row.original.PLACA_VEHICULO}</Link> : '—',
  },
  {
    accessorKey: 'POSICION_ANTERIOR_EN_VEHICULO',
    header: 'Posición anterior',
    cell: ({ row }) => row.original.POSICION_ANTERIOR_EN_VEHICULO || '—',
  },
  {
    accessorKey: 'POSICION_NUEVA_EN_VEHICULO',
    header: 'Nueva posición',
    cell: ({ row }) => row.original.POSICION_NUEVA_EN_VEHICULO || '—',
  },
  {
    accessorKey: 'REMANENTE_MEDIDO_MM',
    header: 'Remanente',
    cell: ({ row }) => {
      const val = row.getValue<number>('REMANENTE_MEDIDO_MM')
      return val !== null ? `${val} mm` : '—'
    },
  },
  {
    accessorKey: 'PRESION_AIRE_PSI',
    header: 'Presión',
    cell: ({ row }) => row.original.PRESION_AIRE_PSI,
  },
  {
    accessorKey: 'TORQUE_APLICADO_NM',
    header: 'Torque',
    cell: ({ row }) => row.original.TORQUE_APLICADO_NM,
  },
  {
    accessorKey: 'KM_RECORRIDOS_EN_ETAPA',
    header: 'Km recorridos',
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
    cell: ({ row }) => row.getValue('USUARIO_REGISTRADOR') || '—',
  },
]
