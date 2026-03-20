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