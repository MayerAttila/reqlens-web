import Image from "next/image";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiActivity,
  FiClock,
  FiKey,
  FiMail,
  FiServer
} from "react-icons/fi";
import { ButtonLink } from "../../components/ui/button";

const workflowSteps = [
  {
    title: "Create a project",
    text: "Generate one API key per backend service, environment, or client app."
  },
  {
    title: "Install the middleware",
    text: "Send method, route, status, latency, and error payload snapshots to Reqlens."
  },
  {
    title: "Watch the dashboard",
    text: "Review recent requests, slow calls, problem routes, and alert settings in one place."
  }
];

const features = [
  {
    icon: FiActivity,
    title: "Request history",
    text: "Inspect the last calls across projects with route, method, status, latency, and timestamp."
  },
  {
    icon: FiAlertTriangle,
    title: "Problem calls",
    text: "Surface errors and latency spikes without digging through raw server logs."
  },
  {
    icon: FiClock,
    title: "Latency thresholds",
    text: "Set per-project limits so slow traffic is tracked against the right baseline."
  },
  {
    icon: FiMail,
    title: "Email alerts",
    text: "Choose who gets summaries for errored requests and latency alerts."
  },
  {
    icon: FiKey,
    title: "API key control",
    text: "Reveal, copy, regenerate, and rotate project keys from guarded project settings."
  },
  {
    icon: FiServer,
    title: "Multi-project view",
    text: "Separate backend apps while still seeing account-level health and activity."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-[92vh] overflow-hidden bg-panel-strong">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-background)_0%,var(--color-background)_58%,rgba(27,27,29,0.72)_100%)]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link className="flex items-center gap-3" href="/">
            <Image
              src="/images/logo.png"
              alt="Reqlens"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-2xl object-cover"
            />
            <span className="text-xl font-black">Reqlens</span>
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Login
            </ButtonLink>
            <ButtonLink href="/signup">Sign up</ButtonLink>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-84px)] max-w-7xl items-center px-5 pb-16 pt-10 md:px-8">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-soft">
              Request analytics for backend APIs
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl lg:text-8xl">
              See the requests your backend is actually handling.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
              Reqlens collects API request logs from your services and turns them
              into a focused dashboard for latency, errors, project health, and
              team alerts.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Create workspace</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                Open dashboard
              </ButtonLink>
            </div>
            <div className="mt-10 grid max-w-3xl gap-3 text-sm text-muted sm:grid-cols-3">
              <ProofPoint label="Tracked calls" value="30+" />
              <ProofPoint label="Problem routes" value="Errors + latency" />
              <ProofPoint label="Setup path" value="Project API key" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-panel bg-background px-5 py-20 md:px-8"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Add visibility without building another internal tool.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article className="rounded-3xl bg-panel p-6" key={step.title}>
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-sm font-black text-primary-soft">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-panel-strong px-5 py-20 md:px-8" id="features">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              What you get
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              A quiet control room for API behavior.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted">
              Reqlens is built for small teams that need clear request telemetry:
              not a giant observability suite, and not scattered console output.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="rounded-3xl bg-panel p-5" key={feature.title}>
                  <Icon className="size-5 text-primary-soft" />
                  <h3 className="mt-4 font-black">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-3xl bg-panel p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              Start with one backend
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Create a project, copy the key, and inspect the first request.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Use one project per backend app. Rotate keys, invite teammates,
              tune latency thresholds, and keep request history organized by
              service.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/signup">Get started</ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              Login
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-panel bg-background px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-md text-sm text-muted">
            <Link className="flex w-fit items-center gap-3 text-foreground" href="/">
              <Image
                src="/images/logo.png"
                alt="Reqlens"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover"
              />
              <span className="font-black">Reqlens</span>
            </Link>
            <p className="mt-3 max-w-md">
              Request analytics for backend APIs, focused on latency, errors,
              and project-level visibility.
            </p>
          </div>

          <div className="grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <FooterColumn
              title="Product"
              links={[
                ["Features", "#features"],
                ["How it works", "#how-it-works"],
                ["Dashboard", "/dashboard"]
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                ["Login", "/login"],
                ["Sign up", "/signup"],
                ["Reset password", "/forgot-password"]
              ]}
            />
            <FooterColumn
              title="Resources"
              links={[
                ["API projects", "/dashboard/projects"],
                ["Request logs", "/dashboard/requests"],
                ["Problem calls", "/dashboard/errors"]
              ]}
            />
            <div>
              <h3 className="font-black text-foreground">Developed by</h3>
              <div className="mt-4 grid gap-3 text-muted">
                <Link
                  className="transition hover:text-foreground"
                  href="https://github.com/MayerAttila"
                >
                  Mayer Attila
                </Link>
                <Link
                  className="transition hover:text-foreground"
                  href="https://github.com/MayerAttila/reqlens"
                >
                  GitHub repository
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-panel pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Reqlens. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span>Privacy policy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProofPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel/85 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-black text-foreground">{value}</p>
    </div>
  );
}

function FooterColumn({
  links,
  title
}: {
  links: Array<[string, string]>;
  title: string;
}) {
  return (
    <div>
      <h3 className="font-black text-foreground">{title}</h3>
      <div className="mt-4 grid gap-3 text-muted">
        {links.map(([label, href]) => (
          <Link className="transition hover:text-foreground" href={href} key={label}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
