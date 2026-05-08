import { useState, useMemo } from 'react';
import type { FilterChipDef } from './use-table-filter';

export interface SelectFilterDef<T> {
  key: string;
  accessor: (item: T) => string;
}

export function useComboFilter<T>(
  data: T[],
  chips: FilterChipDef<T>[],
  selects: SelectFilterDef<T>[]
) {
  const [chipActive, setChipActive] = useState<string>('todos');
  const [selectValues, setSelectValues] = useState<Record<string, string[]>>({});

  const setSelectValue = (key: string, values: string[]) =>
    setSelectValues(prev => ({ ...prev, [key]: values }));

  const chipCounts = useMemo(() => {
    const result: Record<string, number> = { todos: data.length };
    for (const chip of chips) result[chip.key] = data.filter(chip.filter).length;
    return result;
  }, [data, chips]);

  const filteredData = useMemo(() => {
    let result = data;
    if (chipActive !== 'todos') {
      const chip = chips.find(c => c.key === chipActive);
      if (chip) result = result.filter(chip.filter);
    }
    for (const sel of selects) {
      const vals = selectValues[sel.key];
      if (vals && vals.length > 0)
        result = result.filter(item => vals.includes(sel.accessor(item)));
    }
    return result;
  }, [data, chipActive, selectValues, chips, selects]);

  return { filteredData, chipActive, setChipActive, chipCounts, selectValues, setSelectValue };
}
