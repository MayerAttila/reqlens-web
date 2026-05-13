import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiCopy } from "react-icons/fi";
import type { Project, ProjectStats } from "./projects-panel";

type ProjectCardProps = {
  onCopyApiKey: (projectId: string) => void;
  project: Project;
  stats: ProjectStats;
};

export function ProjectCard({
  onCopyApiKey,
  project,
  stats
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-3xl border border-line/40 bg-panel-strong text-left shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-primary/10"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <div className="p-5">
      <div className="block w-full text-left">
        <div className="flex min-h-12 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-black">{project.name}</h3>
              <span className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-black text-muted">
                {roleLabel(project.accessRole)}
              </span>
            </div>
          </div>
          {canCopyApiKey(project.accessRole) && project.hasApiKey ? (
            <IconAction
              label="Copy API key"
              onClick={() => onCopyApiKey(project.id)}
              variant="primary"
            >
              <FiCopy className="size-4" />
            </IconAction>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
        <CardMetric
          label="Requests"
          value={String(stats.requestCount)}
        />
        <CardMetric
          label="Latency"
          value={String(stats.slowCount)}
        />
        <CardMetric
          label="Errors"
          value={String(stats.errorCount)}
        />
        <CardMetric
          label="Members"
          value={String(project.members.length)}
        />
      </div>
      <p className="mt-5 line-clamp-2 min-h-10 text-sm text-muted">
        {project.description || "No description yet."}
      </p>
      </div>
    </article>
  );
}

function canCopyApiKey(role: Project["accessRole"]) {
  return role === "owner" || role === "admin" || role === "developer";
}

function roleLabel(role: Project["accessRole"]) {
  switch (role) {
    case "admin":
      return "Admin";
    case "developer":
      return "Developer";
    case "viewer":
      return "Viewer";
    case "owner":
      return "Owner";
    default:
      return "Viewer";
  }
}

function IconAction({
  children,
  label,
  onClick,
  variant = "secondary"
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "bg-primary/15 text-primary-soft hover:bg-primary hover:text-white"
      : "bg-surface text-foreground hover:bg-surface-soft";

  return (
    <button
      aria-label={label}
      className={`grid size-10 shrink-0 place-items-center rounded-2xl transition ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function CardMetric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-background/45 p-3">
      <p className="text-muted">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
