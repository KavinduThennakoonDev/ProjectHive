"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface OptionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** A shadcn Select driven by a simple list of options. */
export function OptionSelect({
  value,
  onValueChange,
  options,
  id,
  placeholder,
  invalid,
  disabled,
  className,
  "aria-label": ariaLabel,
}: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid || undefined} aria-label={ariaLabel} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Builds options from a list of enum values and their labels. */
export function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] }));
}
