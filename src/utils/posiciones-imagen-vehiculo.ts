import type { LadoPosicion } from './configuraciones-neumaticos';

export interface MarcadorImagen {
    codigo: string;
    x: number;
    y: number;
    w: number;
    h: number;
    lado: LadoPosicion | null;
    repuesto?: boolean;
    etiqueta?: 'IZQ' | 'DER' | 'ARRIBA' | 'ABAJO';
}

export interface ConfiguracionImagen {
    imagen: string;
    anchoNatural: number;
    altoNatural: number;
    marcadores: MarcadorImagen[];
}

/**
 * Coordenadas medidas a mano sobre las imágenes reales en public/assets/vehiculos:
 * cada marcador se superpone a la rueda dibujada en el PNG. `anchoNatural`/`altoNatural`
 * deben coincidir SIEMPRE con el tamaño real del archivo, o todos los marcadores se corren.
 */
export const CONFIGURACION_IMAGEN: Record<number, ConfiguracionImagen> = {
    2: {
        imagen: '/assets/vehiculos/moto.png',
        anchoNatural: 554,
        altoNatural: 1080,
        marcadores: [
            { codigo: 'POS01', x: 280, y: 240, w: 90, h: 150, lado: 'CENTRO', etiqueta: 'IZQ' },
            { codigo: 'POS02', x: 280, y: 855, w: 90, h: 150, lado: 'CENTRO', etiqueta: 'DER' },
        ],
    },
    5: {
        imagen: '/assets/vehiculos/carro.png',
        anchoNatural: 436,
        altoNatural: 970,
        marcadores: [
            { codigo: 'POS01', x: 54, y: 158, w: 60, h: 135, lado: 'IZQ' },
            { codigo: 'POS02', x: 376, y: 158, w: 60, h: 135, lado: 'DER' },
            { codigo: 'POS03', x: 54, y: 765, w: 60, h: 132, lado: 'IZQ' },
            { codigo: 'POS04', x: 376, y: 765, w: 60, h: 132, lado: 'DER' },
            { codigo: 'RES01', x: 223, y: 881, w: 70, h: 132, lado: null, repuesto: true },
        ],
    },
    7: {
        imagen: '/assets/vehiculos/camion.png',
        anchoNatural: 388,
        altoNatural: 889,
        marcadores: [
            { codigo: 'POS01', x: 70, y: 276, w: 60, h: 135, lado: 'IZQ' },
            { codigo: 'POS02', x: 317, y: 276, w: 60, h: 135, lado: 'DER' },
            { codigo: 'POS03', x: 67, y: 711, w: 34, h: 116, lado: 'IZQ' },
            { codigo: 'POS04', x: 108, y: 711, w: 34, h: 116, lado: 'IZQ', etiqueta: 'ARRIBA' },
            { codigo: 'POS05', x: 277, y: 711, w: 34, h: 116, lado: 'DER', etiqueta: 'ARRIBA' },
            { codigo: 'POS06', x: 318, y: 711, w: 34, h: 116, lado: 'DER' },
            { codigo: 'RES01', x: 194, y: 830, w: 50, h: 96, lado: null, repuesto: true },
        ],
    },
};

export function obtenerConfiguracionImagen(cantidadNeumaticos: number | string | null | undefined): ConfiguracionImagen | null {
    if (cantidadNeumaticos === null || cantidadNeumaticos === undefined) return null;
    const cantidad = typeof cantidadNeumaticos === 'string' ? parseInt(cantidadNeumaticos, 10) : cantidadNeumaticos;
    if (!Number.isFinite(cantidad)) return null;
    return CONFIGURACION_IMAGEN[cantidad] ?? null;
}
