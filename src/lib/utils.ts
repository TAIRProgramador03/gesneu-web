import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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