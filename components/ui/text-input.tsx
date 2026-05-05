"use client";

import { InputHTMLAttributes, ReactNode, useMemo, useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiType,
  FiUser
} from "react-icons/fi";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: "email" | "name" | "password" | "text";
};

export function TextInput({
  className = "",
  icon,
  label,
  name,
  type = "text",
  ...props
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const iconType = useMemo(() => icon ?? inferIcon(name, type), [icon, name, type]);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm text-muted">{label}</span> : null}
      <span className="group flex items-center gap-3 border-b border-line py-3 transition focus-within:border-primary">
        <span className="grid size-4 place-items-center text-muted transition group-focus-within:text-primary">
          {renderIcon(iconType)}
        </span>
        <input
          className={`min-w-0 flex-1 border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted ${className}`}
          name={name}
          type={inputType}
          {...props}
        />
        {isPassword ? (
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-foreground"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

function inferIcon(
  name: InputHTMLAttributes<HTMLInputElement>["name"],
  type: InputHTMLAttributes<HTMLInputElement>["type"]
): TextInputProps["icon"] {
  const normalizedName = String(name ?? "").toLowerCase();

  if (type === "email" || normalizedName.includes("email")) {
    return "email";
  }

  if (type === "password" || normalizedName.includes("password")) {
    return "password";
  }

  if (normalizedName.includes("name") || normalizedName.includes("user")) {
    return "name";
  }

  return "text";
}

function renderIcon(icon: TextInputProps["icon"]): ReactNode {
  const className = "size-4";

  switch (icon) {
    case "email":
      return <FiMail className={className} />;
    case "name":
      return <FiUser className={className} />;
    case "password":
      return <FiLock className={className} />;
    default:
      return <FiType className={className} />;
  }
}
