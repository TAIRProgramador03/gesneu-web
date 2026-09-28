export type LadoPosicion = 'IZQ' | 'DER' | 'CENTRO';

export interface PosicionNeumatico {
  codigo: string;
  eje: number | null;
  lado: LadoPosicion | null;
  repuesto: boolean;
}

export interface Rango {
  min: number;
  max: number;
}

/**
 * Rangos aceptados al medir un neumático montado. Dependen del tipo de vehículo:
 * una moto usa menos torque y su banda de rodadura es mucho más delgada que la de
 * un camión, así que un único rango fijo rechazaba mediciones legítimas.
 */
export interface RangosMedicion {
  /** Profundidad de banda, en mm. */
  remanente: Rango;
  /** Presión de aire, en psi. */
  presion: Rango;
  /** Torque de ajuste, en N·m. No aplica al repuesto (RES01). */
  torque: Rango;
}

export interface ConfiguracionNeumaticos {
  cantidad: number;
  nombre: string;
  posiciones: PosicionNeumatico[];
  rangos: RangosMedicion;
}
 
/** Valores de camioneta/camión: son los que rigen mientras no se reconozca el vehículo. */
const RANGOS_ESTANDAR: RangosMedicion = {
  remanente: { min: 0, max: 25 },
  presion: { min: 25, max: 50 },
  torque: { min: 110, max: 160 },
};

export const CONFIGURACIONES_NEUMATICOS: Record<number, ConfiguracionNeumaticos> = {
  2: {
    cantidad: 2,
    nombre: 'Moto',
    rangos: {
      remanente: { min: 0, max: 7 },
      presion: { min: 25, max: 50 },
      torque: { min: 30, max: 90 },
    },
    posiciones: [
      { codigo: 'POS01', eje: 1, lado: 'CENTRO', repuesto: false },
      { codigo: 'POS02', eje: 2, lado: 'CENTRO', repuesto: false },
    ],
  },
  5: {
    cantidad: 5,
    nombre: 'Auto / camioneta',
    rangos: RANGOS_ESTANDAR,
    posiciones: [
      { codigo: 'POS01', eje: 1, lado: 'IZQ', repuesto: false },
      { codigo: 'POS02', eje: 1, lado: 'DER', repuesto: false },
      { codigo: 'POS03', eje: 2, lado: 'IZQ', repuesto: false },
      { codigo: 'POS04', eje: 2, lado: 'DER', repuesto: false },
      { codigo: 'RES01', eje: null, lado: null, repuesto: true },
    ],
  },
  7: {
    cantidad: 7,
    nombre: 'Camión, eje trasero doble',
    rangos: RANGOS_ESTANDAR,
    posiciones: [
      { codigo: 'POS01', eje: 1, lado: 'IZQ', repuesto: false },
      { codigo: 'POS02', eje: 1, lado: 'DER', repuesto: false },
      { codigo: 'POS03', eje: 2, lado: 'IZQ', repuesto: false },
      { codigo: 'POS04', eje: 2, lado: 'IZQ', repuesto: false },
      { codigo: 'POS05', eje: 2, lado: 'DER', repuesto: false },
      { codigo: 'POS06', eje: 2, lado: 'DER', repuesto: false },
      { codigo: 'RES01', eje: null, lado: null, repuesto: true },
    ],
  },
};

export function obtenerConfiguracionNeumaticos(cantidadNeumaticos: number | string | null | undefined): ConfiguracionNeumaticos | null {
  if (cantidadNeumaticos === null || cantidadNeumaticos === undefined) return null;
  const cantidad = typeof cantidadNeumaticos === 'string' ? parseInt(cantidadNeumaticos, 10) : cantidadNeumaticos;
  if (!Number.isFinite(cantidad)) return null;
  return CONFIGURACIONES_NEUMATICOS[cantidad] ?? null;
}

/**
 * Rangos de medición del vehículo. Si la cantidad no se reconoce devuelve los estándar
 * (camioneta/camión) en vez de null: preferimos validar con el rango más común antes que
 * dejar el formulario sin validación alguna.
 */
export function obtenerRangosMedicion(cantidadNeumaticos: number | string | null | undefined): RangosMedicion {
  return obtenerConfiguracionNeumaticos(cantidadNeumaticos)?.rangos ?? RANGOS_ESTANDAR;
}
