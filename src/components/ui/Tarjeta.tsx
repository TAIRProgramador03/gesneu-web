import * as React from 'react';

import { cn } from '@/lib/utils';

import { EsquinaOvalo } from './EsquinaOvalo';

interface TarjetaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Color de acento (hex). Con `esquina` o `franja` se usa para decorar la tarjeta. */
  acento?: string;
  /** Bola decorativa en la esquina superior derecha. Solo para tarjetas grandes que envuelven un bloque. */
  esquina?: boolean;
  /** Franja gruesa de color en el borde superior. */
  franja?: boolean;
  /** Sube un poco la sombra al pasar el mouse. */
  interactiva?: boolean;
  /** Quita el relleno interno (cuando el contenido ya trae el suyo, como una tabla a sangre). */
  sinRelleno?: boolean;
}

/**
 * Tarjeta base de la app. Usa los colores del tema (claro y oscuro sin lógica
 * extra) y deja el acento como decoración opcional.
 */
export function Tarjeta({
  acento,
  esquina = false,
  franja = false,
  interactiva = false,
  sinRelleno = false,
  className,
  style,
  children,
  ...resto
}: TarjetaProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card text-card-foreground shadow-sm',
        franja && acento && 'border-t-[5px]',
        interactiva && 'transition-shadow hover:shadow-md',
        !sinRelleno && 'p-4 sm:p-5',
        className
      )}
      style={franja && acento ? { borderTopColor: acento, ...style } : style}
      {...resto}
    >
      {esquina && acento && <EsquinaOvalo color={acento} />}
      {children}
    </div>
  );
}
