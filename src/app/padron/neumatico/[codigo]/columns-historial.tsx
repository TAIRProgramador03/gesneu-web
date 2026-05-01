'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { convertToDateHuman } from '@/lib/utils'
import type { MovimientoHistorial } from '@/hooks/use-neumatico-detail'

const TipoMovimientoBadgeNew = ({ tipo = 0, text = '' }: { tipo: number, text: string }) => {
  return (
    <span className={`px-6 py-0.5 rounded-md  font-medium text-xs ${tipo === 2 ? 'bg-green-100 text-green-700' :
      tipo === 4 ? 'bg-indigo-100 text-indigo-700' :
        tipo === 5 ? 'bg-red-100 text-red-700' :
          tipo === 6 ? 'bg-cyan-100 text-cyan-700' :
            tipo === 7 ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
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
    cell: ({ row }) => row.original.PLACA_VEHICULO || '—',
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
