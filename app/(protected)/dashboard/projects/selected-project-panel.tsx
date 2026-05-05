import { Button } from "../../../../components/ui/button";
import type { Project, ProjectStats } from "./projects-panel";

type SelectedProjectPanelProps = {
  onCopyApiKey: (projectId: string) => void;
  onDeleteProject: (project: Project) => void;
  onOpenCreate: () => void;
  project: Project | undefined;
  stats: ProjectStats | null;
};

export function SelectedProjectPanel({
  onCopyApiKey,
  onDeleteProject,
  onOpenCreate,
  project,
  stats
}: SelectedProjectPanelProps) {
  if (!project || !stats) {
    return (
      <aside className="rounded-3xl bg-panel p-6">
        <h2 className="text-2xl font-black">No project selected</h2>
        <p className="mt-2 text-sm text-muted">
          Create a project to generate an API key and start tracking requests.
        </p>
        <Button className="mt-6" onClick={onOpenCreate} type="button">
          Create project
        </Button>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 rounded-3xl bg-panel p-6">
      <p className="text-sm uppercase tracking-[0.22em] text-primary">
        Selected project
      </p>
      <h2 className="mt-2 truncate text-3xl font-black">{project.name}</h2>
      <p className="mt-2 text-sm text-muted">
        {project.description || "No description yet."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <DetailStat label="Requests" value={stats.requestCount} />
        <DetailStat label="Latency alerts" tone="warning" value={stats.slowCount} />
        <DetailStat label="Errors" tone="danger" value={stats.errorCount} />
        <DetailStat label="Last status" value={stats.lastStatus ?? "-"} />
        <DetailStat
          label="Last request"
          value={stats.lastRequestAt ? formatShortDate(stats.lastRequestAt) : "-"}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {project.hasApiKey ? (
          <Button onClick={() => onCopyApiKey(project.id)} type="button">
            Copy API key
          </Button>
        ) : null}
        <Button
          onClick={() => onDeleteProject(project)}
          type="button"
          variant="secondary"
        >
          Delete project
        </Button>
      </div>
    </aside>
  );
}

function DetailStat({
  label,
  tone = "default",
  value
}: {
  label: string;
  tone?: "danger" | "default" | "warning";
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-panel-strong p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          tone === "danger"
            ? "text-red-300"
            : tone === "warning"
              ? "text-orange-200"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatShortDate(dateValue: string) {
  return new Date(dateValue).toLocaleString([], {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  });
}
