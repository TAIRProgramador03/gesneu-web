import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const [month, setMonth] = React.useState<Date>(value ?? new Date());

  React.useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className={`${value ? "text-black" : "text-gray-400"}`}>
            {value ? format(value, "dd/MM/yyyy") : placeholder}
          </span>

          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            onChange?.(date);

            if (date) {
              setMonth(date);
            }

            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
