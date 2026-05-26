import Image from "next/image";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiHome,
  FiSettings
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

const workspaceItems = [
  {
    icon: FiHome,
    label: "Overview",
    title: "Daily health at a glance",
    text: "Track projects, today request volume, recent problem calls, and the latest API activity from one first screen.",
    metric: "152",
    metricLabel: "requests today"
  },
  {
    icon: FiDatabase,
    label: "Projects",
    title: "One backend, one project",
    text: "Separate services, rotate API keys, tune alert thresholds, and invite teammates per project.",
    metric: "3",
    metricLabel: "active projects"
  },
  {
    icon: FiActivity,
    label: "Requests",
    title: "Searchable request logs",
    text: "Review method, route, status, latency, and timestamp without opening raw server logs.",
    metric: "Logs",
    metricLabel: "searchable"
  },
  {
    icon: FiAlertTriangle,
    label: "Problems",
    title: "Errors and slow calls",
    text: "Filter down to bad status codes or latency alerts and inspect the payload when needed.",
    metric: "46",
    metricLabel: "problem calls"
  },
  {
    icon: FiBarChart2,
    label: "Statistics",
    title: "Traffic, status, and method mix",
    text: "Use timeframe charts to understand request shape, error rate, slow routes, and project performance.",
    metric: "36%",
    metricLabel: "error rate"
  },
  {
    icon: FiSettings,
    label: "Settings",
    title: "Workspace defaults",
    text: "Set account defaults for alert audiences, digest time, invite roles, and developer endpoints.",
    metric: "08:00",
    metricLabel: "digest time"
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

      <section className="bg-background px-5 py-20 md:px-8" id="workspace">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                After registration
              </p>
              <h2 className="mt-3 text-4xl font-black md:text-5xl">
                The dashboard is organized around the work you do every day.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">
                Reqlens keeps the main areas visible in a simple sidebar:
                projects, request logs, problem calls, statistics, and account
                defaults.
              </p>
              <div className="mt-8 overflow-hidden rounded-3xl bg-panel-strong p-3">
                {workspaceItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${
                        index === 1
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-muted"
                      }`}
                      key={item.label}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workspaceItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    className="rounded-3xl bg-panel p-5 shadow-xl shadow-black/10"
                    key={item.label}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
                        <Icon className="size-5" />
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">
                          {item.metric}
                        </p>
                        <p className="mt-1 text-xs text-muted">{item.metricLabel}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-primary">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-panel-strong px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.44fr_0.56fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              Statistics preview
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              See traffic shape, status mix, and method mix before digging into rows.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted">
              The statistics page gives a quick read on volume, error rate,
              latency alerts, and which projects or routes need attention.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <ProofPoint label="Requests" value="152" />
              <ProofPoint label="Errors" value="46" />
              <ProofPoint label="Latency alerts" value="18" />
            </div>
          </div>

          <div className="rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">Request performance</h3>
              <span className="rounded-2xl border border-line px-4 py-2 text-sm font-black text-muted">
                Last 12 hours
              </span>
            </div>

            <div className="mt-6 h-72 rounded-3xl bg-panel-strong p-5">
              <div className="relative h-full overflow-hidden">
                <div className="absolute inset-0 grid grid-rows-4 pb-5">
                  {Array.from({ length: 4 }, (_, index) => (
                    <span
                      className="border-t border-dashed border-line/35"
                      key={index}
                    />
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-5 h-44 [clip-path:polygon(0_92%,12%_82%,24%_84%,36%_68%,48%_78%,60%_54%,72%_84%,84%_44%,100%_58%,100%_100%,0_100%)] bg-[linear-gradient(180deg,#6f63ff_0%,rgba(111,99,255,0.72)_100%)]" />
                <div className="absolute inset-x-0 bottom-5 h-44 [clip-path:polygon(0_100%,12%_94%,24%_94%,36%_82%,48%_84%,60%_68%,72%_88%,84%_58%,100%_70%,100%_100%,0_100%)] bg-[linear-gradient(180deg,#ffd166_0%,rgba(255,209,102,0.72)_100%)]" />
                <div className="absolute inset-x-0 bottom-5 h-44 [clip-path:polygon(0_100%,12%_100%,24%_100%,36%_94%,48%_96%,60%_82%,72%_96%,84%_70%,100%_82%,100%_100%,0_100%)] bg-[linear-gradient(180deg,#ff5b73_0%,rgba(255,91,115,0.72)_100%)]" />
                <div className="absolute bottom-5 left-0 right-0 h-px bg-line" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted">
                  <span>10 PM</span>
                  <span>1 AM</span>
                  <span>4 AM</span>
                  <span>7 AM</span>
                  <span>9 AM</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl bg-panel-strong p-4">
                <p className="font-black">Status mix</p>
                <div className="mt-5 h-4 overflow-hidden rounded-full bg-background/60">
                  <div className="flex h-full">
                    <span className="h-full w-[64%] bg-primary-soft" />
                    <span className="h-full w-[26%] bg-yellow-200" />
                    <span className="h-full w-[10%] bg-red-300" />
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <StatusPreviewDot color="bg-primary-soft" label="2xx / 3xx" value="64%" />
                  <StatusPreviewDot color="bg-yellow-200" label="4xx" value="26%" />
                  <StatusPreviewDot color="bg-red-300" label="5xx" value="10%" />
                </div>
              </div>

              <div className="rounded-3xl bg-panel-strong p-4">
                <p className="font-black">Method mix</p>
                <div className="mt-4 grid grid-cols-[8rem_1fr] items-center gap-4">
                  <div className="grid size-28 place-items-center rounded-full bg-[conic-gradient(#8f5cff_0_42%,#56d6ff_42%_66%,#ffd166_66%_82%,#ff6b80_82%_100%)]">
                    <div className="grid size-16 place-items-center rounded-full bg-panel-strong text-center">
                      <span className="text-xl font-black">152</span>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <StatusPreviewDot color="bg-[#8f5cff]" label="GET" value="42%" />
                    <StatusPreviewDot color="bg-cyan-300" label="POST" value="24%" />
                    <StatusPreviewDot color="bg-yellow-200" label="PATCH" value="16%" />
                    <StatusPreviewDot color="bg-red-300" label="DELETE" value="18%" />
                  </div>
                </div>
              </div>
            </div>
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

function StatusPreviewDot({
  color,
  label,
  value
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-muted">
      <span className="inline-flex items-center gap-2 font-black text-foreground">
        <span className={`size-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span>{value}</span>
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
