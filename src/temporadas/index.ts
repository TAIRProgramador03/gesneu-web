import { navidad } from './navidad/config';
import type { Temporada } from './tipos';

/** Registro de temporadas. Para sumar una: crear su carpeta y agregarla aquí. */
export const TEMPORADAS: Temporada[] = [navidad];

const ZONA_HORARIA = 'America/Lima';

/** Mes y día de hoy en hora de Perú (no la del servidor ni UTC). */
function hoyEnPeru(): { mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const mes = Number(partes.find((p) => p.type === 'month')?.value);
  const dia = Number(partes.find((p) => p.type === 'day')?.value);
  return { mes, dia };
}

function estaEnRango(t: Temporada, mes: number, dia: number): boolean {
  const hoy = mes * 100 + dia;
  const desde = t.desde.mes * 100 + t.desde.dia;
  const hasta = t.hasta.mes * 100 + t.hasta.dia;
  // Si desde > hasta, la temporada cruza el año nuevo.
  return desde <= hasta ? hoy >= desde && hoy <= hasta : hoy >= desde || hoy <= hasta;
}

/**
 * Temporada vigente, o null.
 * NEXT_PUBLIC_TEMPORADA_FORZADA: id de una temporada para forzarla (pruebas),
 * o "ninguna" para apagarlas todas. Vacío = mandan las fechas.
 */
export function obtenerTemporadaActiva(): Temporada | null {
  const forzada = process.env.NEXT_PUBLIC_TEMPORADA_FORZADA?.trim();
  if (forzada === 'ninguna') return null;
  if (forzada) return TEMPORADAS.find((t) => t.id === forzada) ?? null;

  const { mes, dia } = hoyEnPeru();
  return TEMPORADAS.find((t) => estaEnRango(t, mes, dia)) ?? null;
}
