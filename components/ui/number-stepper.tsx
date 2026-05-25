"use client";

import { useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp, FiEdit3 } from "react-icons/fi";

type NumberStepperProps = {
  ariaLabel?: string;
  className?: string;
  defaultValue?: number;
  disabled?: boolean;
  label?: string;
  max?: number;
  min?: number;
  name: string;
  onChange?: (value: number) => void;
  required?: boolean;
  unit?: string;
  value?: number;
};

export function NumberStepper({
  ariaLabel,
  className = "",
  defaultValue = 0,
  disabled = false,
  label,
  max,
  min,
  name,
  onChange,
  required,
  unit,
  value
}: NumberStepperProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue));
  const displayValue = internalValue;

  useEffect(() => {
    if (controlled) {
      setInternalValue(String(value));
    }
  }, [controlled, value]);

  function commit(nextValue: string) {
    const sanitized = nextValue.replace(/[^\d]/g, "");
    setInternalValue(sanitized);

    if (sanitized) {
      onChange?.(clampValue(Number(sanitized), min, max));
    }
  }

  function step(direction: 1 | -1) {
    const current = Number(displayValue || min || 0);
    const next = clampValue(current + direction, min, max);

    setInternalValue(String(next));
    onChange?.(next);
  }

  return (
    <label className={`grid gap-2 ${className}`}>
      {label ? <span className="text-sm text-muted">{label}</span> : null}
      <span className="group flex h-12 items-center gap-3 border-b border-line transition focus-within:border-primary">
        <FiEdit3 className="size-3.5 shrink-0 text-muted transition group-focus-within:text-primary" />
        <input
          aria-label={ariaLabel}
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
          disabled={disabled}
          inputMode="numeric"
          max={max}
          min={min}
          name={name}
          onBlur={() => {
            if (!displayValue && min !== undefined) {
              commit(String(min));
            }
          }}
          onChange={(event) => commit(event.target.value)}
          pattern="[0-9]*"
          required={required}
          type="text"
          value={displayValue}
        />
        {unit ? (
          <span className="shrink-0 text-xs text-muted transition group-focus-within:text-primary">
            {unit}
          </span>
        ) : null}
        <span className="grid shrink-0 overflow-hidden rounded-lg border border-line bg-background/45">
          <button
            aria-label="Increase value"
            className="grid size-5 place-items-center text-muted transition hover:bg-surface hover:text-primary-soft disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || (max !== undefined && Number(displayValue || 0) >= max)}
            onClick={() => step(1)}
            type="button"
          >
            <FiChevronUp className="size-3.5" />
          </button>
          <button
            aria-label="Decrease value"
            className="grid size-5 place-items-center border-t border-line text-muted transition hover:bg-surface hover:text-primary-soft disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || (min !== undefined && Number(displayValue || 0) <= min)}
            onClick={() => step(-1)}
            type="button"
          >
            <FiChevronDown className="size-3.5" />
          </button>
        </span>
      </span>
    </label>
  );
}

function clampValue(value: number, min: number | undefined, max: number | undefined) {
  if (min !== undefined && value < min) {
    return min;
  }

  if (max !== undefined && value > max) {
    return max;
  }

  return value;
}
