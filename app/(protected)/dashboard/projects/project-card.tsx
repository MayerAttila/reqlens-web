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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black">{project.name}</h3>
            <p className="mt-1 text-xs text-muted">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-2 text-xs text-muted">
              {project.members.length} collaborator
              {project.members.length === 1 ? "" : "s"}
              {project.invites.length
                ? ` - ${project.invites.length} pending`
                : ""}
            </p>
          </div>
          {project.accessRole === "owner" && project.hasApiKey ? (
            <IconAction
              label="Copy API key"
              onClick={() => onCopyApiKey(project.id)}
              variant="primary"
            >
              <FiCopy className="size-4" />
            </IconAction>
          ) : null}
        </div>
        <p
          className="mt-2 line-clamp-2 text-sm text-muted"
        >
          {project.description || "No description yet."}
        </p>
      </div>

      <div className="mt-6 grid gap-3 text-xs md:grid-cols-3">
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
      </div>
      </div>

      {project.accessRole !== "owner" ? (
        <div className="border-t border-background bg-background/35 px-5 py-4">
          <span className="inline-flex rounded-full bg-surface px-3 py-1 text-xs text-muted">
            Shared with you
          </span>
        </div>
      ) : null}
    </article>
  );
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
