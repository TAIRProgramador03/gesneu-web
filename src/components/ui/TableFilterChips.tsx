'use client';

import * as React from 'react';
import Skeleton from '@mui/material/Skeleton';
import type { FilterChipDef } from '@/hooks/use-table-filter';

/* El puntito de cada chip era un hex en un `style` inline, así que no tenía
   manera de cambiar con el tema: el de 'slate' (#475569) quedaba invisible
   sobre el fondo oscuro. Ahora es una clase, y en oscuro sube un par de
   tonos. El fondo del chip activo no se toca: es un color saturado con
   texto blanco, se lee igual en los dos modos. */
const COLOR_MAP: Record<string, { dot: string; active: string }> = {
  sky:    { dot: 'bg-sky-600 dark:bg-sky-400',       active: 'bg-sky-600 text-white border-sky-600' },
  green:  { dot: 'bg-green-600 dark:bg-green-400',   active: 'bg-green-600 text-white border-green-600' },
  yellow: { dot: 'bg-yellow-600 dark:bg-yellow-400', active: 'bg-yellow-500 text-white border-yellow-500' },
  amber:  { dot: 'bg-amber-600 dark:bg-amber-400',   active: 'bg-amber-500 text-white border-amber-500' },
  red:    { dot: 'bg-red-600 dark:bg-red-400',       active: 'bg-red-600 text-white border-red-600' },
  lime:   { dot: 'bg-lime-600 dark:bg-lime-400',     active: 'bg-lime-600 text-white border-lime-600' },
  stone:  { dot: 'bg-stone-500 dark:bg-stone-400',   active: 'bg-stone-500 text-white border-stone-500' },
  purple: { dot: 'bg-purple-600 dark:bg-purple-400', active: 'bg-purple-600 text-white border-purple-600' },
  blue:   { dot: 'bg-blue-600 dark:bg-blue-400',     active: 'bg-blue-600 text-white border-blue-600' },
  orange: { dot: 'bg-orange-600 dark:bg-orange-400', active: 'bg-orange-500 text-white border-orange-500' },
  cyan:   { dot: 'bg-cyan-600 dark:bg-cyan-400',     active: 'bg-cyan-600 text-white border-cyan-600' },
  slate:  { dot: 'bg-slate-600 dark:bg-slate-400',   active: 'bg-slate-600 text-white border-slate-600' },
};

interface TableFilterChipsProps<T> {
  chips: FilterChipDef<T>[];
  counts: Record<string, number>;
  active: string;
  onChange: (key: string) => void;
  isLoading?: boolean;
}

export function TableFilterChips<T>({
  chips,
  counts,
  active,
  onChange,
  isLoading = false,
}: TableFilterChipsProps<T>) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[...Array(chips.length + 1)].map((_, i) => (
          <Skeleton key={i} variant="rounded" width={100} height={34} sx={{ borderRadius: '999px' }} />
        ))}
      </div>
    );
  }

  const allChips = [
    { key: 'todos', label: 'Todos', color: 'slate' as const },
    ...chips,
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {allChips.map(chip => {
        const isActive = active === chip.key;
        const colors = COLOR_MAP[chip.color] ?? COLOR_MAP.slate;
        const count = counts[chip.key] ?? 0;

        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            className={[
              'flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer select-none',
              isActive
                ? colors.active
                : 'bg-card text-texto-apagado border-border hover:border-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {!isActive && (
              <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${colors.dot}`} />
            )}
            {chip.label}
            <span className={[
              'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5.5 text-center tabular-nums',
              isActive ? 'bg-white/25 text-white' : 'bg-superficie-2 text-texto-apagado',
            ].join(' ')}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
