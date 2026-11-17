import type { NeumaticoDelHistorial } from '@/api/Neumaticos'
import type { NeumaticoInstalado } from '@/hooks/use-placa-detail'
import { diasDesdeFecha } from '@/lib/utils'

/**
 * Una inspección sirve hoy y los 3 días anteriores; desde el día 4 hace falta una nueva.
 * Es la misma regla de reubicación y desasignación (`diasDiferencia >= 4`).
 */
export const DIAS_VIGENCIA_INSPECCION = 4

export type NivelVida = 'critico' | 'alerta' | 'bueno'

/** Mismos umbrales que `vidaColor()` en utils/helpers.ts: < 39 crítico, < 79 alerta. */
export const nivelVida = (pct: number): NivelVida => (pct < 39 ? 'critico' : pct < 79 ? 'alerta' : 'bueno')

const fechaDe = (m: NeumaticoDelHistorial): string =>
  m.FECHA_MOVIMIENTO ? String(m.FECHA_MOVIMIENTO).substring(0, 10) : String(m.FECHA_REGISTRO_MOVIMIENTO).substring(0, 10)

/** Un movimiento de la placa agrupa a todos los neumáticos que se tocaron el mismo día con la misma acción. */
export const claveGrupo = (m: NeumaticoDelHistorial): string => `${fechaDe(m)}_${m.ID_ACCION_REALIZADA}`

/**
 * Cifras de una placa: salud de los neumáticos montados, estado de inspección y totales del historial.
 * Antes el padre las calculaba sueltas; centralizarlas deja que el encabezado, las tarjetas y el
 * estado de inspección lean exactamente los mismos números.
 */
export function calcularEstadisticasPlaca(neumaticosActuales: NeumaticoInstalado[], historial: NeumaticoDelHistorial[]) {
  // --- Salud de lo montado ---
  const montados = neumaticosActuales.length
  const niveles = { bueno: 0, alerta: 0, critico: 0 }
  neumaticosActuales.forEach((n) => { niveles[nivelVida(n.ESTADO)] += 1 })
  const promedioVida = montados > 0
    ? Math.round(neumaticosActuales.reduce((acc, n) => acc + (n.ESTADO ?? 0), 0) / montados)
    : null
  const masCritico = montados > 0
    ? neumaticosActuales.reduce((peor, n) => (n.ESTADO < peor.ESTADO ? n : peor), neumaticosActuales[0])
    : null

  // --- Historial ---
  const grupos = new Map<string, { fecha: string; accion: number; nombre: string; filas: NeumaticoDelHistorial[] }>()
  historial.forEach((m) => {
    const k = claveGrupo(m)
    if (!grupos.has(k)) grupos.set(k, { fecha: fechaDe(m), accion: m.ID_ACCION_REALIZADA, nombre: m.ACCION_REALIZADA, filas: [] })
    grupos.get(k)!.filas.push(m)
  })
  // 'AAAA-MM-DD' ordena bien como texto
  const ordenados = Array.from(grupos.values()).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const inspecciones = ordenados.filter((g) => g.accion === 7)
  const ultimoMovimiento = ordenados[0] ?? null
  const ultimaInspeccion = inspecciones[0] ?? null

  const dias = ultimaInspeccion ? diasDesdeFecha(ultimaInspeccion.fecha) : null
  const vigente = dias === null ? null : dias < DIAS_VIGENCIA_INSPECCION
  const diasParaVencer = dias === null ? null : Math.max(0, DIAS_VIGENCIA_INSPECCION - dias)

  const codigos = new Set(historial.map((m) => m.CODIGO_NEUMATICO))
  const dadosDeBaja = new Set(historial.filter((m) => m.ID_ACCION_REALIZADA === 5).map((m) => m.CODIGO_NEUMATICO))

  return {
    montados, niveles, promedioVida, masCritico,
    totalMovimientos: grupos.size,
    totalInspecciones: inspecciones.length,
    rotaciones: ordenados.filter((g) => g.accion === 4).length,
    neumaticosHistoricos: codigos.size,
    dadosDeBaja: dadosDeBaja.size,
    ultimoMovimiento: ultimoMovimiento ? { fecha: ultimoMovimiento.fecha, accion: ultimoMovimiento.nombre } : null,
    ultimaInspeccion: ultimaInspeccion
      ? {
        fecha: ultimaInspeccion.fecha,
        dias,
        vigente,
        diasParaVencer,
        usuario: ultimaInspeccion.filas.map((f) => f.USUARIO_REGISTRADOR?.trim()).find(Boolean) ?? null,
        neumaticosMedidos: new Set(ultimaInspeccion.filas.map((f) => f.CODIGO_NEUMATICO)).size,
      }
      : null,
  }
}

export type EstadisticasPlaca = ReturnType<typeof calcularEstadisticasPlaca>
