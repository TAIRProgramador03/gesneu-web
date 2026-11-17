import type { NeumaticoBuscado } from '@/api/Neumaticos'
import type { MovimientoHistorial } from '@/hooks/use-neumatico-detail'
import { getDifferenceDays } from '@/utils/helpers'

/** Remanente (mm) por debajo del cual el neumático ya no debe seguir en servicio. */
export const REMANENTE_MINIMO = 3

/**
 * Cálculos de desgaste y proyección de un neumático a partir de su historial.
 * Antes vivían dentro de VidaUtilCard; se sacaron para que el encabezado (alerta
 * de días restantes) y la tarjeta de desgaste lean exactamente el mismo número.
 */
export function calcularEstadisticasNeumatico(neu: NeumaticoBuscado, historial: MovimientoHistorial[]) {
  const montado = neu.REMANENTE_MONTADO ?? 0
  const actual = neu.REMANENTE_ACTUAL ?? 0

  const kmTotal = historial.reduce((acc, m) => acc + (m.KM_RECORRIDOS_EN_ETAPA ?? 0), 0)
  const mmDesgastados = Math.max(0, montado - actual)
  const tasaDesgaste = kmTotal > 0 ? (mmDesgastados / kmTotal) * 1000 : 0

  let diasDeRecorrido = 0
  let anteriorParada = ''
  let anteriorBaja = ''
  let restarUno = false
  // `as`: TypeScript no ve la asignación dentro del forEach y reduciría el tipo a `null`
  let fechaMontaje = null as string | null

  historial.forEach((history, index) => {
    // * Montaje
    if (history.ID_ACCION_REALIZADA === 2) {
      restarUno = anteriorBaja === history.FECHA_MOVIMIENTO
      anteriorParada = history.FECHA_MOVIMIENTO
      fechaMontaje = history.FECHA_MOVIMIENTO
      return
    }
    // * Baja o recupero
    if (history.ID_ACCION_REALIZADA === 6 || history.ID_ACCION_REALIZADA === 5) {
      let resta = getDifferenceDays({ anterior: anteriorParada, actual: history.FECHA_MOVIMIENTO })
      if (restarUno) resta = resta - 1
      diasDeRecorrido += resta
      anteriorBaja = history.FECHA_MOVIMIENTO
      restarUno = false
      return
    }
    // * Última inspección
    if (history.ID_ACCION_REALIZADA === 7 && index === historial.length - 1) {
      let resta = getDifferenceDays({ anterior: anteriorParada, actual: history.FECHA_MOVIMIENTO })
      if (restarUno) resta = resta - 1
      diasDeRecorrido += resta
      restarUno = false
    }
  })

  const remanenteSeries = historial.map((m) => m.REMANENTE_MEDIDO_MM)
  const qtyInspecciones = historial.filter((m) => m.ID_ACCION_REALIZADA === 7).length

  const mmRestantes = Math.max(0, actual - REMANENTE_MINIMO)
  const kmRestantes = tasaDesgaste > 0 ? (mmRestantes / tasaDesgaste) * 1000 : null
  const tasaDiaria = diasDeRecorrido > 0 ? mmDesgastados / diasDeRecorrido : 0
  const diasRestantes = tasaDiaria > 0 ? Math.round(mmRestantes / tasaDiaria) : null
  const fechaEstimada = diasRestantes !== null
    ? new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000)
    : null

  const costo = neu.COSTO_NEUMATICO ?? 0
  const costoPorKm = kmTotal >= 1 ? costo / kmTotal : 0
  const costoPorMm = mmDesgastados > 0 ? costo / mmDesgastados : 0
  const kmPorMm = kmTotal > 0 && mmDesgastados > 0 ? kmTotal / mmDesgastados : 0

  return {
    kmTotal, tasaDesgaste, tasaDiaria, diasDeRecorrido, remanenteSeries, mmDesgastados,
    kmRestantes, diasRestantes, fechaEstimada, mmRestantes, qtyInspecciones,
    costoPorKm, costoPorMm, kmPorMm, fechaMontaje,
  }
}

export type EstadisticasNeumatico = ReturnType<typeof calcularEstadisticasNeumatico>
