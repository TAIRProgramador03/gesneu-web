import * as React from 'react';

interface EsquinaOvaloProps {
  /** Color de acento de la tarjeta (hex). */
  color: string;
  /** Lado del recuadro de la esquina, en px. */
  tamano?: number;
}

/**
 * Bola decorativa (relleno suave, sin contorno) para la esquina superior derecha de una tarjeta.
 * El padre debe ser `relative` y llevar el mismo radio de esquina. Lo recorta
 * su propio recuadro, no la tarjeta, así que no corta tooltips ni menús.
 */
export function EsquinaOvalo({ color, tamano = 150 }: EsquinaOvaloProps): React.JSX.Element {
  const relleno = `color-mix(in srgb, ${color} 15%, transparent)`;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 overflow-hidden rounded-tr-[inherit]"
      style={{ width: tamano, height: tamano * 0.8 }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: tamano * 0.95,
          height: tamano * 0.95,
          right: -tamano * 0.22,
          top: -tamano * 0.3,
          background: relleno,
        }}
      />
    </span>
  );
}
