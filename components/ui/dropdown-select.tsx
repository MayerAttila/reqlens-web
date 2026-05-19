"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export type DropdownSelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type DropdownSelectProps<TValue extends string> = {
  inputName?: string;
  onChange?: (value: TValue) => void;
  options: Array<DropdownSelectOption<TValue>>;
  size?: "md" | "sm";
  value: TValue;
};

export function DropdownSelect<TValue extends string>({
  inputName,
  onChange,
  options,
  size = "md",
  value
}: DropdownSelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      {inputName ? <input name={inputName} type="hidden" value={value} /> : null}
      <button
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border text-left text-sm font-black outline-none transition ${
          size === "sm" ? "h-10 px-3" : "h-12 px-4"
        } ${
          isOpen
            ? "border-primary bg-primary/10 text-primary-soft"
            : "border-line bg-background/45 text-foreground hover:border-primary/40"
        }`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedOption.label}</span>
        <FiChevronDown
          className={`size-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-primary/35 bg-panel shadow-2xl shadow-black/30">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                className={`block w-full px-4 text-left text-sm font-black transition ${
                  size === "sm" ? "py-2.5" : "py-3"
                } ${
                  selected
                    ? "bg-primary/20 text-primary-soft"
                    : "text-foreground hover:bg-surface"
                }`}
                key={option.value}
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
