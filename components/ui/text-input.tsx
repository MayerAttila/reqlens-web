import { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({ className = "", label, ...props }: TextInputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-muted">{label}</span>
      <input
        className={`border-0 border-b border-line bg-transparent px-0 py-3 text-foreground outline-none placeholder:text-muted focus:border-primary ${className}`}
        {...props}
      />
    </label>
  );
}
