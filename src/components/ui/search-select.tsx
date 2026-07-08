import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ComponentProps } from "react";

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

interface SearchSelectProps extends Omit<
  ComponentProps<typeof Button>,
  "onChange" | "value" | "children"
> {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  disabled = false,
  className,
  contentClassName,
  ...buttonProps
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);

  const [search, setSearch] = React.useState("");

  const parentRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;

    const lower = search.toLowerCase();

    return options.filter((option) =>
      (option.label ?? "").toLowerCase().includes(lower),
    );
  }, [options, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
    enabled: open,
  });

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
      });
    }
  }, [open, rowVirtualizer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(`w-full justify-between font-normal`, className)}
          {...buttonProps}
        >
          <span
            className={`truncate ${selectedOption?.label ? "text-black" : "text-gray-400"}`}
          >
            {selectedOption?.label ?? placeholder}
          </span>

          <ChevronsUpDown
            className="
              ml-2
              h-4
              w-4
              shrink-0
              opacity-50
            "
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "min-w-(--radix-popover-trigger-width) p-0", // â† min-w en vez de w-
          contentClassName,
        )}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />

          {filteredOptions.length === 0 ? (
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          ) : (
            <CommandList>
              <div
                ref={parentRef}
                className="max-h-75 overflow-auto mt-2 no-scrollbar"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const option = filteredOptions[virtualItem.index];

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onChange(option.value);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="absolute left-0 top-0 w-full"
                        style={{
                          height: virtualItem.size,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </div>
              </div>
              {/* BOTON LIMPIAR */}
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full cursor-pointer"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}