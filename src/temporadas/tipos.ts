import type { ComponentType } from 'react';

export interface FechaMesDia {
  mes: number; // 1-12
  dia: number; // 1-31
}

export type ClaveImagen = 'login';
export type ClaveTexto = 'saludoLogin';
/** Lugares de la app donde una temporada puede poner un adorno. */
export type ClaveDecoracion = 'sombreroTituloLogin' | 'sombreroAvatar' | 'arbolitoCabecera' | 'coronaMenu';

/**
 * Paquete de una temporada. Todo es opcional salvo id y fechas: una temporada
 * solo cambia lo que declara, el resto de la app queda como siempre.
 */
export interface Temporada {
  id: string;
  /** Inicio y fin INCLUSIVOS, sin año: se repiten cada año. Puede cruzar año nuevo (ej. 20/12 al 06/01). */
  desde: FechaMesDia;
  hasta: FechaMesDia;
  /** Reemplazos de imagen por clave. */
  imagenes?: Partial<Record<ClaveImagen, string>>;
  /** Textos que cambian. */
  textos?: Partial<Record<ClaveTexto, string>>;
  /** Adornos que se colocan en lugares concretos de la app (ver `Decoracion`). */
  decoraciones?: Partial<Record<ClaveDecoracion, ComponentType>>;
  /** Capa visual flotante (nieve, confeti...). Debe usar pointer-events: none. */
  Efectos?: ComponentType;
  /** Carga los estilos de la temporada solo cuando está activa. */
  cargarEstilos?: () => Promise<unknown>;
}
