import * as React from 'react';

import { cn } from '@/lib/utils';

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  /** Icono lucide ya con su tamaño (p. ej. <Layers3 className="size-5" />). */
  icono?: React.ReactNode;
  /** Degradado del recuadro del icono. Literales completos: Tailwind no detecta clases armadas. */
  degradado?: string;
  /** Dato corto a la derecha del título, por ejemplo «1 248 neumáticos». */
  contador?: React.ReactNode;
  /** Botones o controles alineados a la derecha (bajan debajo del título en móvil). */
  acciones?: React.ReactNode;
  className?: string;
}

/** Encabezado común de todas las vistas: icono, título, descripción y acciones. */
export function EncabezadoPagina({
  titulo,
  descripcion,
  icono,
  degradado = 'from-[#167bd9] to-[#0a3a6a]',
  contador,
  acciones,
  className,
}: EncabezadoPaginaProps): React.JSX.Element {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icono && (
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-sm',
              degradado
            )}
          >
            {icono}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{titulo}</h1>
            {contador && (
              <span className="rounded-full bg-superficie-2 px-3 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {contador}
              </span>
            )}
          </div>
          {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{acciones}</div>}
    </header>
  );
}
