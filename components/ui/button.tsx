import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
};

const baseClass =
  "inline-flex items-center justify-center rounded-lg px-5 py-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/50";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-soft",
  secondary: "bg-surface text-foreground hover:bg-surface-soft",
  ghost: "bg-transparent text-muted hover:text-foreground"
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  className = "",
  variant = "primary",
  href,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${baseClass} ${variantClass[variant]} ${className}`} href={href} {...props}>
      {children}
    </Link>
  );
}
