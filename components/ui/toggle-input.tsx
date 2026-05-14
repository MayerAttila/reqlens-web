"use client";

import { useState } from "react";

type ToggleInputProps = {
  defaultChecked?: boolean;
  disabledLabel?: string;
  enabledLabel?: string;
  name: string;
};

export function ToggleInput({
  defaultChecked = false,
  disabledLabel = "Disabled",
  enabledLabel = "Enabled",
  name
}: ToggleInputProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="group flex shrink-0 cursor-pointer items-center gap-3 rounded-full bg-background/45 px-3 py-2 text-sm font-black text-foreground transition hover:bg-surface">
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={(event) => setChecked(event.target.checked)}
        type="checkbox"
      />
      <span
        className={`relative h-6 w-11 rounded-full border transition duration-200 ${
          checked
            ? "border-primary/50 bg-primary/25 shadow-[0_0_22px_rgba(160,96,255,0.22)]"
            : "border-line bg-background"
        }`}
      >
        <span
          className={`absolute top-1 size-3.5 rounded-full transition-all duration-200 ${
            checked
              ? "left-6 bg-primary-soft"
              : "left-1 bg-muted group-hover:bg-foreground"
          }`}
        />
      </span>
      {checked ? enabledLabel : disabledLabel}
    </label>
  );
}
