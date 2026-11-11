import * as React from 'react';

/**
 * Gorro de Navidad (public/assets/gorro-navideno.png, 512x512). Se dimensiona
 * en `em`, así que escala con el texto sobre el que se coloca.
 */
export function SombreroNavidad({ style }: { style?: React.CSSProperties }): React.JSX.Element {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- adorno pequeño, no necesita optimización
    <img
      alt=""
      aria-hidden
      src="/assets/gorro-navideno.png"
      style={{ width: '1.05em', height: '1.05em', pointerEvents: 'none', ...style }}
    />
  );
}
