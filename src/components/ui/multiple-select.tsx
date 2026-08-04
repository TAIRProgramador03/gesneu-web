import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Option {
  value: string;
  label: string;
};

interface SelectedChipProps {
  option: Option;
  onRemove: (e: React.MouseEvent, selectedValue: string) => void;
};

const SelectedChip = React.memo(({ option, onRemove }: SelectedChipProps) => {
  return (
    <button
      type="button"
      className="
          flex
          items-center
          gap-1
          rounded-md
          border
          px-2
          py-1
          text-sm
          shrink-0
          cursor-pointer
          hover:bg-sky-700/90
          transition-colors
          bg-sky-700
        "
      onClick={(e) => e.stopPropagation()}
      aria-label={`Seleccionado: ${option.label}`}
    >
      <span className="max-w-65 truncate text-white" title={option.label}>
        {option.label}
      </span>

      <button
        type="button"
        onClick={(e) => onRemove(e, option.value)}
        className="
            rounded-sm
            text-white
            bg-transparent
            hover:bg-red-500/60
            cursor-pointer
            p-0
            h-auto
            border-0
            ml-1
          "
        aria-label={`Eliminar ${option.label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </button>
  );
});

interface MultiSearchSelectProps {
  options: Option[];
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSearchSelect({
  options,
  value = [],
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  disabled = false,
  className,
}: MultiSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const parentRef = React.useRef<HTMLDivElement>(null);

  // opciones seleccionadas
  const optionsMap = React.useMemo(() => {
    return new Map(options.map((option) => [option.value, option]));
  }, [options]);

  const selectedOptions = React.useMemo(() => {
    return value.map((id) => optionsMap.get(id)).filter(Boolean) as Option[];
  }, [value, optionsMap]);

  // filtrado estable
  const filteredOptions = React.useMemo(() => {
    const lower = search.trim().toLowerCase();

    return options.filter((option) => {
      const matchesSearch =
        !lower || (option.label ?? "").toLowerCase().includes(lower);
      return matchesSearch;
    });
  }, [options, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
    enabled: open,
  });

  const toggleSelection = React.useCallback(
    (selectedValue: string) => {
      const exists = value.includes(selectedValue);

      if (exists) {
        onChange(value.filter((v) => v !== selectedValue));
      } else {
        onChange([...value, selectedValue]);
      }
    },
    [value, onChange],
  );

  const removeSelection = React.useCallback(
    (e: React.MouseEvent, selectedValue: string) => {
      e.stopPropagation();

      onChange(value.filter((v) => v !== selectedValue));
    },
    [value, onChange],
  );

  React.useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      rowVirtualizer.measure();
    }, 0);

    return () => clearTimeout(timeout);
  }, [open, filteredOptions.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "w-full justify-between items-start min-h-10 h-auto px-3 py-2",
            className,
          )}
        >
          <div className="flex flex-wrap justify-start gap-2 flex-1 overflow-hidden">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400 font-normal truncate">
                {placeholder}
              </span>
            ) : (
              selectedOptions.map((option) => (
                <SelectedChip
                  key={option.value}
                  option={option}
                  onRemove={removeSelection}
                />
              ))
            )}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 sticky top-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="
          w-(--radix-popover-trigger-width)
          p-0
        "
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className="max-h-none overflow-visible">
            <div ref={parentRef} className="max-h-72 overflow-auto mt-2">
              {filteredOptions.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                <div
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const option = filteredOptions[virtualItem.index];

                    const isSelected = value.includes(option.value);

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => toggleSelection(option.value)}
                        className={`
                            rounded-none
                            absolute
                            left-0
                            top-0
                            w-full
                            flex
                            items-center
                            justify-between
                            cursor-pointer
                            ${isSelected ? 'bg-sky-800/20' : ''}
                          `}
                        style={{
                          height: virtualItem.size,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <span>{option.label}</span>

                        <Check
                          className={cn(
                            "h-4 w-4 transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </div>
              )}
            </div>

            {value.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                      w-full
                      bg-red-700
                      text-white
                      hover:bg-red-700/80
                      hover:text-white
                  `}
                  onClick={() => onChange([])}
                >
                  Limpiar selección
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}