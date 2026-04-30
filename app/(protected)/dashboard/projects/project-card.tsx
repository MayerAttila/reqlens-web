import type { Project, ProjectStats } from "./projects-panel";

type ProjectCardProps = {
  isSelected: boolean;
  onSelect: (projectId: string) => void;
  project: Project;
  stats: ProjectStats;
};

export function ProjectCard({
  isSelected,
  onSelect,
  project,
  stats
}: ProjectCardProps) {
  const healthClass =
    stats.health === "Healthy"
      ? isSelected
        ? "bg-primary/20 text-primary-soft"
        : "bg-primary/15 text-primary-soft"
      : stats.health === "Has errors"
        ? "bg-red-500/20 text-red-200"
        : isSelected
          ? "bg-surface text-muted"
          : "bg-surface text-muted";

  return (
    <article
      className={`rounded-3xl border p-5 text-left transition ${
        isSelected
          ? "border-primary/45 bg-panel-strong"
          : "border-transparent bg-panel-strong hover:border-line hover:bg-surface"
      }`}
    >
      <button
        className="block w-full text-left"
        onClick={() => onSelect(project.id)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-lg font-black">{project.name}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${healthClass}`}>
            {stats.health}
          </span>
        </div>
        <p
          className="mt-2 line-clamp-2 text-sm text-muted"
        >
          {project.description || "No description yet."}
        </p>
      </button>

      <div className="mt-5 grid gap-3 text-xs md:grid-cols-3">
        <CardMetric
          isSelected={isSelected}
          label="Requests"
          value={String(stats.requestCount)}
        />
        <CardMetric
          isSelected={isSelected}
          label="Errors"
          value={String(stats.errorCount)}
        />
        <CardMetric
          isSelected={isSelected}
          label="Last status"
          value={stats.lastStatus ? String(stats.lastStatus) : "-"}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>
    </article>
  );
}

function CardMetric({
  isSelected,
  label,
  value
}: {
  isSelected: boolean;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}
