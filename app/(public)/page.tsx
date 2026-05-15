import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "../../components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-0 text-foreground">
      <section className="flex min-h-screen flex-col overflow-hidden bg-panel-strong p-8 shadow-2xl shadow-black/30 md:p-12 lg:p-20">
        <nav className="flex items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <Image
              src="/images/logo.png"
              alt="Reqlens"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-2xl object-cover"
            />
            <span className="text-xl font-black tracking-[-0.04em]">Reqlens</span>
          </Link>
          <div className="flex items-center gap-3">
            <ButtonLink href="/login" variant="ghost">
              Login
            </ButtonLink>
            <ButtonLink href="/signup">Sign up</ButtonLink>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 pt-12 lg:grid-cols-[0.58fr_0.42fr] lg:pt-0">
          <section>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Request analytics for backend APIs
            </p>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.88] tracking-[-0.08em] md:text-8xl">
              See what your APIs are doing.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
              Drop in the Reqlens middleware, collect request activity, and inspect
              latency, errors, and route volume from one focused dashboard.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Create workspace</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                I already have one
              </ButtonLink>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-background/60 p-5">
            <div className="mb-5 flex items-center justify-between text-sm text-muted">
              <span>Live preview</span>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary-soft">
                demo
              </span>
            </div>
            <div className="grid gap-3">
              {[
                ["GET /users/:id", "42 ms", "200"],
                ["POST /checkout", "188 ms", "200"],
                ["GET /reports", "921 ms", "500"]
              ].map(([route, latency, status]) => (
                <div
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-panel p-4"
                  key={route}
                >
                  <span className="font-semibold">{route}</span>
                  <span className="text-muted">{latency}</span>
                  <span className="rounded-full bg-surface px-3 py-1 text-sm">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
