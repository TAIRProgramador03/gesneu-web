'use client';

import * as React from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { EsRecuperadoBadge } from '@/components/ui/EsRecuperadoBadge';
import { LinearProgressItem } from '@/components/ui/LinearProgress';
import { TipoMovimientoBadge } from '@/components/ui/TipoMovimientoBadge';
import { cn, convertToDateHuman } from '@/lib/utils';
import { PadronExcel } from '@/types/padron';

interface TarjetaNeumaticoProps {
  neu: PadronExcel;
  seleccionado: boolean;
  onToggle: () => void;
}

/** Dato corto "etiqueta + valor" de la rejilla inferior. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="text-muted-foreground">{etiqueta} </span>
      <span className="font-semibold text-foreground">{children}</span>
    </div>
  );
}

/**
 * Versión móvil de una fila del padrón. Muestra lo que se decide en campo
 * (código, situación, medida, vida útil, ubicación); el resto de columnas se
 * consulta en el detalle del neumático.
 */
export function TarjetaNeumatico({ neu, seleccionado, onToggle }: TarjetaNeumaticoProps): React.JSX.Element {
  const montado = Boolean(neu.PLACA);

  return (
    <article
      className={cn(
        'flex shrink-0 flex-col gap-2.5 rounded-xl border bg-card p-3 transition-colors',
        seleccionado && 'border-sky-700 bg-sky-50 dark:border-sky-400 dark:bg-sky-500/10'
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={seleccionado}
          onCheckedChange={onToggle}
          aria-label={`Seleccionar neumático ${neu.CODIGO}`}
          className="size-5"
        />
        <Link
          href={`/padron/neumatico/${neu.CODIGO}`}
          className="min-w-0 flex-1 truncate text-base font-bold text-sky-800 dark:text-sky-300"
        >
          {neu.CODIGO}
        </Link>
        <TipoMovimientoBadge tipoMovimiento={neu.TIPO_MOVIMIENTO} />
      </div>

      <p className="min-w-0 text-sm font-medium">
        {neu.MARCA}
        <span className="font-normal text-muted-foreground"> · {neu.MEDIDA} · {neu['DISEÑO']}</span>
      </p>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <LinearProgressItem estado={neu.ESTADO ?? 0} width="100%" />
        </div>
        <span className="min-w-14 text-right text-xs font-semibold tabular-nums">
          {neu.REMANENTE ?? '-'} mm
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Dato etiqueta="Taller">{neu.PROYECTO || '-'}</Dato>
        <Dato etiqueta="Km">{neu.KILOMETRO ?? '-'}</Dato>
        {montado ? (
          <>
            <Dato etiqueta="Placa">
              <Link href={`/padron/placa/${neu.PLACA}`} className="text-sky-800 dark:text-sky-300">
                {neu.PLACA}
              </Link>
            </Dato>
            <Dato etiqueta="Posición">{neu.POSICION_NEU || '-'}</Dato>
          </>
        ) : null}
        {neu.FECHA_BAJA ? <Dato etiqueta="Baja">{convertToDateHuman(neu.FECHA_BAJA)}</Dato> : null}
        <Dato etiqueta="Recuperado">
          <EsRecuperadoBadge esRecuperado={neu.RECUPERADO ?? false} />
        </Dato>
      </div>
    </article>
  );
}
