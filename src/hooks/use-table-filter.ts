import { useState, useMemo } from 'react';

export interface FilterChipDef<T> {
  key: string;
  label: string;
  filter: (item: T) => boolean;
  color: 'sky' | 'green' | 'yellow' | 'amber' | 'red' | 'lime' | 'stone' | 'purple' | 'blue' | 'orange' | 'cyan' | 'slate';
}

export function useTableFilter<T>(data: T[], chips: FilterChipDef<T>[]) {
  const [active, setActive] = useState<string>('todos');

  const counts = useMemo(() => {
    const result: Record<string, number> = { todos: data.length };
    for (const chip of chips) {
      result[chip.key] = data.filter(chip.filter).length;
    }
    return result;
  }, [data, chips]);

  const filteredData = useMemo(() => {
    if (active === 'todos') return data;
    const chip = chips.find(c => c.key === active);
    return chip ? data.filter(chip.filter) : data;
  }, [data, active, chips]);

  return { active, setActive, counts, filteredData };
}
