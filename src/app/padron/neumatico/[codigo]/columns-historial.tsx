'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge'
import { convertToDateHuman } from '@/lib/utils'
import type { MovimientoHistorial } from '@/hooks/use-neumatico-detail'

export const columnsHistorial: ColumnDef<MovimientoHistorial>[] = [
  {
    accessorKey: 'FECHA_INSPECCION',
    header: 'Fecha',
    cell: ({ row }) => convertToDateHuman(row.getValue('FECHA_INSPECCION')),
  },
  {
    accessorKey: 'ACCION_REALIZADA',
    header: 'Tipo',
    cell: ({ row }) => (
      <TipoMovimientoBadge tipoMovimiento={row.getValue('ACCION_REALIZADA')} />
    ),
  },
  {
    accessorKey: 'PLACA_VEHICULO',
    header: 'Placa',
    cell: ({ row }) => row.getValue('PLACA_VEHICULO') || '—',
  },
  {
    accessorKey: 'POSICION_NUEVA_EN_VEHICULO',
    header: 'Posición',
    cell: ({ row }) => row.getValue('POSICION_NUEVA_EN_VEHICULO') || '—',
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
