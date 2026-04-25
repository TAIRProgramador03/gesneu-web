'use client'

import { verificarNeumatico, obtenerHistorialMovimientosPorCodigo } from '@/api/Neumaticos'
import { useQueries } from '@tanstack/react-query'

export interface MovimientoHistorial {
  CODIGO_NEUMATICO: string
  PLACA_VEHICULO: string
  TALLER_ASIGNADO: string
  ACCION_REALIZADA: string
  POSICION_ANTERIOR_EN_VEHICULO: string
  POSICION_NUEVA_EN_VEHICULO: string
  REMANENTE_MEDIDO_MM: number
  PRESION_AIRE_PSI: number
  TORQUE_APLICADO_NM: number
  KM_RECORRIDOS_EN_ETAPA: number
  PORCENTAJE_VIDA_UTIL: number
  OBSERVACION: string
  USUARIO_REGISTRADOR: string
  FECHA_ASIGNACION_A_PLACA: any
  FECHA_INSPECCION: string
  FECHA_MANTENIMIENTO: any
  FECHA_REGISTRO_MOVIMIENTO: string
}


export const useNeumaticoDetail = ({ codigo }: { codigo: string }) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['informacion-neumatico', { codigo }],
        queryFn: () => verificarNeumatico(codigo),
        enabled: !!codigo,
      },
      {
        queryKey: ['historial-movimientos-por-neumatico', { codigo }],
        queryFn: () => obtenerHistorialMovimientosPorCodigo(codigo),
        enabled: !!codigo,
      },
    ],
  })

  const [neumaticoQuery, historialQuery] = results

  const neumatico = neumaticoQuery.data?.data?.[0] ?? null
  const historial: MovimientoHistorial[] = historialQuery.data ?? []

  const isLoading = neumaticoQuery.isLoading || historialQuery.isLoading
  const isError = neumaticoQuery.isError || historialQuery.isError

  return {
    neumatico,
    historial,
    isLoading,
    isError,
  }
}
