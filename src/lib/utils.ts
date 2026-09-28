import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from 'dayjs';
import 'dayjs/locale/es';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



// fecha:string -> YYYYMMDD ejm: 2026-03-08
// return: DDMMYYYY
export const convertToDateHuman = (fecha: string) => {
  if (!fecha) return fecha;
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return fecha;
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


export const convertDateAndHour = (fecha: string) => {
  dayjs.locale('es');
  const fechaOriginal = fecha
  const fechaFormateada = dayjs(fechaOriginal).format('dddd D [de] MMMM [a las] HH:mm');
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
}

/**
 * Convierte una fecha 'AAAA-MM-DD' del backend en un Date a medianoche LOCAL.
 *
 * `new Date('2026-09-25')` NO sirve para esto: el estándar obliga a interpretar
 * una fecha sin hora como medianoche UTC, así que en Perú (UTC-5) cae el día
 * anterior y todas las cuentas de días salen corridas. Armando el Date con
 * números sueltos se usa la zona horaria local, que es lo que queremos.
 *
 * Devuelve null si la fecha viene vacía o no es válida.
 */
export const parsearFechaLocal = (fecha: string | null | undefined): Date | null => {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  const date = new Date(anio, mes - 1, dia);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Días completos transcurridos entre una fecha 'AAAA-MM-DD' y hoy.
 * 0 = hoy, 1 = ayer. Devuelve null si la fecha no es válida.
 */
export const diasDesdeFecha = (fecha: string | null | undefined): number | null => {
  const desde = parsearFechaLocal(fecha);
  if (!desde) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.floor((hoy.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
};

export const capitalizeCustomString = (texto: string) => {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}