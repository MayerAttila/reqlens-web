import Link from "next/link";
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
      <section className="grid min-h-screen overflow-hidden bg-panel-strong shadow-2xl shadow-black/30 lg:grid-cols-[0.43fr_0.57fr]">
        <div className="flex min-h-screen flex-col justify-between px-7 py-8 md:px-16 lg:px-24 xl:px-32 2xl:px-40">
          <Link className="text-sm text-muted transition hover:text-foreground" href="/">
            {eyebrow}
          </Link>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="mb-12">
              <h1 className="mb-5 text-6xl font-black tracking-[-0.07em]">{title}</h1>
              <p className="text-sm font-semibold text-muted">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-muted">
            <span>{switchText}</span>
            <ButtonLink href={switchHref} variant="secondary">
              {switchLabel}
            </ButtonLink>
          </div>
        </div>

        <aside className="relative hidden min-h-screen overflow-hidden bg-primary lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-primary to-accent" />
          <div className="absolute -left-36 top-48 h-96 w-96 rounded-full bg-white/12" />
          <div className="absolute left-8 top-[-80px] h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute right-[-70px] top-[-40px] h-80 w-[520px] rotate-[-8deg] rounded-[90px] bg-white/10" />
          <div className="absolute bottom-[-90px] left-14 h-96 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex h-full min-h-screen flex-col px-20 py-24 xl:px-28 2xl:px-36">
            <div>
              <h2 className="max-w-[720px] text-7xl font-black leading-[0.86] tracking-[-0.07em] xl:text-8xl">
                Welcome to
                <span className="block font-light">Reqlens portal</span>
              </h2>
              <p className="mt-5 text-sm font-semibold text-white/90">
                Login to access your request analytics workspace
              </p>
            </div>

            <div className="mt-auto grid place-items-end">
              <div className="relative h-[430px] w-[620px] scale-110 origin-bottom-right">
                <div className="absolute bottom-0 right-0 h-64 w-72 rounded-t-[40px] border-4 border-panel-strong bg-white shadow-2xl" />
                <div className="absolute bottom-24 right-12 h-3 w-16 rounded-full border-2 border-panel-strong" />
                <div className="absolute bottom-16 right-12 h-3 w-36 rounded-full border-2 border-panel-strong" />
                <div className="absolute bottom-9 right-12 h-3 w-44 rounded-full border-2 border-panel-strong" />
                <div className="absolute bottom-0 left-24 h-72 w-20 rounded-t-full border-4 border-panel-strong bg-white" />
                <div className="absolute bottom-32 left-8 h-44 w-20 rotate-[-18deg] rounded-full border-4 border-panel-strong bg-white" />
                <div className="absolute bottom-1 left-5 h-8 w-24 rounded-l-full rounded-r-md bg-panel-strong" />
                <div className="absolute bottom-1 left-36 h-8 w-24 rounded-l-full rounded-r-md bg-panel-strong" />
                <div className="absolute bottom-72 left-24 h-16 w-16 rounded-full border-4 border-panel-strong bg-white" />
                <div className="absolute bottom-[323px] left-[116px] h-10 w-20 rounded-t-full bg-panel-strong" />
                <div className="absolute bottom-52 right-2 h-24 w-28 rotate-12 rounded-full border-4 border-panel-strong bg-white" />
                <div className="absolute bottom-[300px] right-20 h-16 w-16 rounded-full border-4 border-panel-strong bg-white" />
                <div className="absolute bottom-[344px] right-[92px] h-9 w-16 rounded-t-full bg-panel-strong" />
                <div className="absolute bottom-60 right-0 h-3 w-36 rotate-[-70deg] rounded-full bg-panel-strong" />
                <div className="absolute bottom-10 right-[-36px] h-10 w-28 rotate-[-8deg] rounded-l-full bg-panel-strong" />
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
