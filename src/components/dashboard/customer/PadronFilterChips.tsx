'use client';

import * as React from 'react';
import Skeleton from '@mui/material/Skeleton';

export type PadronFilter = 'todos' | 'DISPONIBLE' | 'ASIGNADO' | 'BAJA' | 'RECUPERADO';

interface Chip {
  key: PadronFilter;
  label: string;
  count: number;
  activeClass: string;
  dotColor: string;
}

interface PadronFilterChipsProps {
  counts: Record<PadronFilter, number>;
  active: PadronFilter;
  onChange: (filter: PadronFilter) => void;
  isLoading?: boolean;
}

export function PadronFilterChips({ counts, active, onChange, isLoading = false }: PadronFilterChipsProps) {
  const chips: Chip[] = [
    { key: 'todos',      label: 'Todos',           count: counts.todos,      activeClass: 'bg-slate-700 text-white border-slate-700',    dotColor: '#94a3b8' },
    { key: 'DISPONIBLE', label: 'Disponibles',      count: counts.DISPONIBLE, activeClass: 'bg-green-600 text-white border-green-600',     dotColor: '#16a34a' },
    { key: 'ASIGNADO',   label: 'Asignados',        count: counts.ASIGNADO,   activeClass: 'bg-yellow-500 text-white border-yellow-500',   dotColor: '#ca8a04' },
    { key: 'BAJA',       label: 'Baja Definitiva',  count: counts.BAJA,       activeClass: 'bg-red-600 text-white border-red-600',         dotColor: '#dc2626' },
    { key: 'RECUPERADO', label: 'Recuperados',      count: counts.RECUPERADO, activeClass: 'bg-lime-600 text-white border-lime-600',       dotColor: '#65a30d' },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chips.map(c => (
          <Skeleton key={c.key} variant="rounded" width={110} height={36} sx={{ borderRadius: '999px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {chips.map(chip => {
        const isActive = active === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            className={[
              'flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer',
              isActive
                ? chip.activeClass
                : 'bg-white dark:bg-card text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:text-slate-800 dark:hover:text-slate-100',
            ].join(' ')}
          >
            {!isActive && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: chip.dotColor, flexShrink: 0 }} />
            )}
            {chip.label}
            <span className={[
              'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center',
              isActive ? 'bg-white dark:bg-card/20 dark:bg-card/20 text-white' : 'bg-slate-100 dark:bg-superficie-2 text-slate-500 dark:text-slate-400',
            ].join(' ')}>
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
