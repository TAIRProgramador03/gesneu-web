import { useState, useMemo } from 'react';

export function useMultiSelectFilter<T>(
  data: T[],
  accessor: (item: T) => string
) {
  const [selected, setSelected] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    if (selected.length === 0) return data;
    return data.filter(item => selected.includes(accessor(item)));
  }, [data, selected, accessor]);

  return { selected, setSelected, filteredData };
}
