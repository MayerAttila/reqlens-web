"use client";

import { FiCopy } from "react-icons/fi";

type CopyIconButtonProps = {
  label: string;
  onCopy: () => void | Promise<void>;
  className?: string;
};

export function CopyIconButton({
  className = "",
  label,
  onCopy
}: CopyIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-muted transition hover:bg-surface-soft hover:text-foreground ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        void onCopy();
      }}
      title={label}
      type="button"
    >
      <FiCopy className="size-5" />
    </button>
  );
}
