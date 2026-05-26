import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { ButtonLink } from "../ui/button";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  switchText: string;
  switchHref: string;
  switchLabel: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  switchText,
  switchHref,
  switchLabel,
  children
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background p-0 text-foreground">
      <section className="grid min-h-screen overflow-hidden bg-panel-strong shadow-2xl shadow-black/30 lg:grid-cols-[0.34fr_0.66fr]">
        <div className="flex min-h-screen flex-col justify-between px-7 py-8 md:px-14 lg:px-14 xl:px-20">
          <Link className="text-sm text-muted transition hover:text-foreground" href="/">
            {eyebrow}
          </Link>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="mb-10">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-primary">
                Reqlens portal
              </p>
              <h1 className="mb-5 text-6xl font-black tracking-[-0.07em]">{title}</h1>
              <p className="text-sm font-semibold text-muted">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 text-sm text-muted lg:mx-0">
            <span>{switchText}</span>
            <ButtonLink href={switchHref} variant="secondary">
              {switchLabel}
            </ButtonLink>
          </div>
        </div>

        <aside className="relative hidden min-h-screen overflow-hidden bg-panel lg:block">
          <Image
            alt="Reqlens dashboard"
            className="h-full w-full object-cover object-left"
            fill
            priority
            sizes="66vw"
            src="/images/dashboard.png"
          />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-panel-strong via-panel-strong/70 to-transparent" />
        </aside>
      </section>
    </main>
  );
}
