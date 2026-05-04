"use client";

import { InputHTMLAttributes } from "react";
import { SearchIcon } from "../icons";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
};

export function SearchInput({
  className = "",
  onClear,
  value,
  ...props
}: SearchInputProps) {
  const hasValue = String(value ?? "").length > 0;

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-surface px-3 py-2 ring-1 ring-line transition focus-within:ring-primary/60 ${className}`}>
      <SearchIcon className="size-5 shrink-0 text-muted" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        type="text"
        value={value}
        {...props}
      />
      {hasValue && onClear ? (
        <button
          className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-foreground"
          onClick={onClear}
          type="button"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
