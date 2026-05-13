'use client'

import { buscarVehiculoPorPlaca, obtenerHistorialPorPlaca, obtenerNeumaticosAsignadosPorPlaca } from '@/api/Neumaticos'
import { useQueries, useQuery } from '@tanstack/react-query'

export interface NeumaticoActual {
  CODIGO_NEUMATICO: string
  POSICION: string
  REMANENTE_MM: number
  PORCENTAJE_VIDA: number
  MARCA: string
  MEDIDA: string
}

export interface VehiculoMain {
  PLACA: string;
  MARCA: string;
  MODELO: string;
  TIPO: string;
  COLOR: string;
  NROSERIE: string,
  NROMOTOR: string,
  ANO: number;
  KILOMETRAJE: number;
  KILOMETRAJE_GESNEU: number;
  ID_OPERACION: number;
  OPERACION: string;
  ID_SUPERVISOR: string;
  TIPO_TERRENO: string;
  RETEN: string;
  mensaje?: null | string
}

export interface NeumaticoInstalado {
  ID: number;
  FECHA_REGISTRO: Date;
  PLACA: string;
  POSICION_NEU: string;
  CODIGO_NEU: string;
  MARCA: string;
  DISENO: string;
  MEDIDA: string;
  REMANENTE: number;
  REMANENTE_ORIGINAL: number;
  ESTADO: number;
  TIPO_MOVIMIENTO: string;
  RECUPERADO: number;
  FECHA_ASIGNACION: Date;
  FECHA_ULTIMO_SUCESO: Date;
  KM_TOTAL_VIDA: number;
  ODOMETRO: number;
  PRESION_AIRE: number;
  TORQUE_APLICADO: number;
}

export const usePlacaDetail = ({ placa }: { placa: string }) => {

  const results = useQueries({
    queries: [
      {
        queryKey: ['vehiculo-su-placa', { placa }],
        queryFn: () => buscarVehiculoPorPlaca(placa),
        enabled: !!placa,
      },
      {
        queryKey: ['neumaticos-actualuales-de-la-', { placa }],
        queryFn: () => obtenerNeumaticosAsignadosPorPlaca(placa),
        enabled: !!placa,
      },
      {
        queryKey: ['historial-del-vehiculo', { placa }],
        queryFn: () => obtenerHistorialPorPlaca(placa),
        enabled: !!placa
      }
    ]
  })

  const [vehiculoQuery, neumaticosInstaladosQuery, historialPlacaQuery] = results

  const vehiculo = vehiculoQuery.data
  const neumaticosInstalados = neumaticosInstaladosQuery.data ?? []
  const historial = historialPlacaQuery.data ?? []

  const isLoading = vehiculoQuery.isLoading || neumaticosInstaladosQuery.isLoading || historialPlacaQuery.isLoading
  const isError = vehiculoQuery.isError || neumaticosInstaladosQuery.isError || historialPlacaQuery.isError

  return {
    vehiculo,
    historial,
    neumaticosActuales: neumaticosInstalados,
    isLoading,
    isError
  }
}
