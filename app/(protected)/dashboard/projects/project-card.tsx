import { useRouter } from "next/navigation";
import { CopyIconButton } from "../../../../components/ui/copy-icon-button";
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
      className="group min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-line/40 bg-panel-strong text-left shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-primary/10 sm:rounded-3xl"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <div className="p-4 sm:p-5">
        <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 max-w-full break-words text-lg font-black leading-tight sm:text-xl">
                {project.name}
              </h3>
              <span className="inline-flex shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-black text-muted sm:px-3 sm:text-xs">
                {roleLabel(project.accessRole)}
              </span>
            </div>
          </div>
          {canCopyApiKey(project.accessRole) && project.hasApiKey ? (
            <CopyIconButton
              className="size-9 rounded-xl sm:size-10 sm:rounded-2xl"
              label="Copy API key"
              onCopy={() => onCopyApiKey(project.id)}
            />
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:mt-6 sm:gap-3 xl:grid-cols-4">
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
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted sm:mt-5 sm:min-h-10">
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

function CardMetric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-background/45 p-3 sm:rounded-2xl">
      <p className="truncate text-muted">{label}</p>
      <p className="mt-1.5 truncate text-lg font-black leading-none sm:mt-2">
        {value}
      </p>
    </div>
  );
}
