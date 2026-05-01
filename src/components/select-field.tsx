"use client";

import { Check, ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  buttonClassName,
}: {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const selected = useMemo(() => options.find((option) => option.value === value) ?? options[0], [options, value]);

  return (
    <div className={cn("relative block", className)}>
      {label ? <span id={labelId} className="text-sm font-bold text-muted">{label}</span> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? labelId : undefined}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "focus-ring mt-2 flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-3 text-left font-bold text-foreground shadow-sm transition hover:border-accent/60 hover:bg-soft",
          buttonClassName,
        )}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180 text-accent")} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-border bg-panel shadow-xl">
          <div role="listbox" className="max-h-64 overflow-auto p-1">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold text-muted transition hover:bg-soft hover:text-foreground",
                    active && "bg-soft text-foreground",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="size-4 shrink-0 text-accent" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
