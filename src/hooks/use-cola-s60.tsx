'use client'

import * as React from 'react'
import { obtenerPendientesColaS60 } from '@/api/Neumaticos'
import type { ColaS60Cabeza } from '@/api/Neumaticos'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user'

/**
 * Cola obligatoria de S60.
 *
 * La S60 pendiente más antigua de los talleres del usuario define la única placa
 * que se puede trabajar. Mientras haya pendientes, cualquier otra placa queda
 * bloqueada para inspeccionar, reubicar, desasignar y asignar.
 *
 * El backend bloquea de todas formas (devuelve 409), pero sin esto el técnico
 * llenaría el modal entero para enterarse recién al guardar.
 *
 * Se consulta `/pendientes` y no `/estado` porque la pantalla muestra la cola
 * completa, no solo la cabeza: así se ve qué viene después y por qué una placa
 * está bloqueada. La cabeza sale del mismo listado, que ya viene ordenado por
 * fecha → hora → correlativo.
 *
 * Si la cola está apagada en el servidor (sin `COLA_S60_DESDE`), el listado
 * llega vacío y nada se bloquea.
 */

/** Cuántas líneas se traen. Son ~20 al día en toda la empresa; 200 sobra. */
const LIMITE = 900

/**
 * Usuarios a los que la cola no les aplica.
 *
 * Administración necesita poder corregir cualquier placa en cualquier momento
 * —justamente para destrabar colas mal armadas—, así que a ellos el aviso solo
 * les informa: nunca les bloquea un botón. Para todos los demás la cola sigue
 * siendo obligatoria y en orden de fecha.
 */
const USUARIOS_SIN_COLA_S60 = ['GESNEU', 'EGAMBOA']

/** Si este usuario está exceptuado de la cola. Compara sin espacios ni mayúsculas. */
export function esUsuarioSinColaS60(usuario?: string | null): boolean {
  if (!usuario) return false
  return USUARIOS_SIN_COLA_S60.includes(usuario.trim().toUpperCase())
}

export const useColaS60 = () => {
  const { user } = useUser()
  const exento = esUsuarioSinColaS60(user?.usuario)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cola-s60-pendientes'],
    queryFn: () => obtenerPendientesColaS60(LIMITE),
    // La cola cambia cuando alguien cierra una S60, no cada segundo.
    staleTime: 30_000,
    retry: 1,
  })

  /**
   * Las líneas sueltas agrupadas por documento de S60.
   *
   * Una S60 trae varias líneas —normalmente 4, el juego completo del vehículo—
   * que comparten almacén, comprobante, placa, fecha y hora. Mostrarlas sueltas
   * haría ver "4 pendientes" donde en realidad hay un solo trabajo.
   *
   * El orden del backend se respeta: como las líneas de un mismo documento
   * vienen seguidas, recorrer el arreglo en orden conserva la cronología.
   */
  const grupos: ColaS60Cabeza[] = React.useMemo(() => {
    const pendientes = data?.pendientes ?? []
    const porDocumento = new Map<string, ColaS60Cabeza>()

    for (const linea of pendientes) {
      const clave = `${linea.almacen}-${linea.comprobante}`
      const grupo = porDocumento.get(clave)
      const detalle = {
        correlativo: linea.correlativo,
        par: linea.par,
        codigoEntrante: linea.codigoEntrante,
        codigoSaliente: linea.codigoSaliente,
      }

      if (grupo) {
        grupo.lineas.push(detalle)
      } else {
        porDocumento.set(clave, {
          almacen: linea.almacen,
          comprobante: linea.comprobante,
          fecha: linea.fecha,
          hora: linea.hora,
          placa: linea.placa,
          operacion: linea.operacion,
          taller: linea.taller,
          lineas: [detalle],
        })
      }
    }

    return [...porDocumento.values()]
  }, [data])

  const cabeza = grupos[0] ?? null
  const hayPendientes = grupos.length > 0

  /**
   * Si una placa se puede trabajar ahora mismo.
   *
   * Ante la duda deja pasar: mientras carga, o si la consulta falló, no se
   * bloquea nada. Trancar un taller por un error de lectura sería peor que el
   * problema que esto resuelve — y el backend igual valida al guardar.
   */
  const placaBloqueada = (placa?: string | null): boolean => {
    // GESNEU / EGAMBOA trabajan cualquier placa aunque haya pendientes.
    if (exento) return false
    if (!hayPendientes || !cabeza) return false
    if (!placa) return false
    return placa.trim().toUpperCase() !== cabeza.placa.trim().toUpperCase()
  }

  return {
    cabeza,
    /** Este usuario no está sujeto a la cola: el aviso le es solo informativo. */
    exento,
    /** Toda la cola agrupada por S60, de la más antigua a la más nueva. */
    grupos,
    hayPendientes,
    placaHabilitada: cabeza?.placa ?? null,
    placaBloqueada,
    isLoading,
    isError,
    refetch,
  }
}
