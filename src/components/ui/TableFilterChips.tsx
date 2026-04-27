'use client';

import * as React from 'react';
import Skeleton from '@mui/material/Skeleton';
import type { FilterChipDef } from '@/hooks/use-table-filter';

const COLOR_MAP: Record<string, { dot: string; active: string }> = {
  sky:    { dot: '#0284c7', active: 'bg-sky-600 text-white border-sky-600' },
  green:  { dot: '#16a34a', active: 'bg-green-600 text-white border-green-600' },
  yellow: { dot: '#ca8a04', active: 'bg-yellow-500 text-white border-yellow-500' },
  amber:  { dot: '#d97706', active: 'bg-amber-500 text-white border-amber-500' },
  red:    { dot: '#dc2626', active: 'bg-red-600 text-white border-red-600' },
  lime:   { dot: '#65a30d', active: 'bg-lime-600 text-white border-lime-600' },
  stone:  { dot: '#78716c', active: 'bg-stone-500 text-white border-stone-500' },
  purple: { dot: '#9333ea', active: 'bg-purple-600 text-white border-purple-600' },
  blue:   { dot: '#2563eb', active: 'bg-blue-600 text-white border-blue-600' },
  orange: { dot: '#ea580c', active: 'bg-orange-500 text-white border-orange-500' },
  cyan:   { dot: '#0891b2', active: 'bg-cyan-600 text-white border-cyan-600' },
  slate:  { dot: '#475569', active: 'bg-slate-600 text-white border-slate-600' },
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
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800',
            ].join(' ')}
          >
            {!isActive && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
            )}
            {chip.label}
            <span className={[
              'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5.5 text-center tabular-nums',
              isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500',
            ].join(' ')}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
