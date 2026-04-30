"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type RequestLog = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
};

type ProjectLogs = {
  projectId: string;
  projectName: string;
  hasApiKey: boolean;
  logs: RequestLog[];
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function ErrorsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");

  const selectedProjects = useMemo(() => {
    if (selectedProjectId === "all") {
      return projects;
    }

    return projects.filter((project) => project.projectId === selectedProjectId);
  }, [projects, selectedProjectId]);

  const visibleLogs = useMemo(
    () =>
      selectedProjects
        .flatMap((project) =>
          project.logs
            .filter((log) => log.statusCode >= 400)
            .map((log) => ({
              ...log,
              projectName: project.projectName
            }))
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        ),
    [selectedProjects]
  );

  const totalErrors = projects.reduce(
    (count, project) =>
      count + project.logs.filter((log) => log.statusCode >= 400).length,
    0
  );
  const serverErrors = projects.reduce(
    (count, project) =>
      count + project.logs.filter((log) => log.statusCode >= 500).length,
    0
  );
  const clientErrors = totalErrors - serverErrors;

  useEffect(() => {
    void loadErrors();
  }, []);

  async function loadErrors() {
    try {
      const response = await fetch(`${apiUrl}/logs?level=errors`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load errors.");
      }

      const data = (await response.json()) as { projects: ProjectLogs[] };
      setProjects(data.projects);
    } catch {
      toast.error("Could not load errors.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Problem calls" value={totalErrors} />
        <SummaryCard label="Client errors" value={clientErrors} />
        <SummaryCard label="Server errors" value={serverErrors} tone="danger" />
      </section>

      <section className="rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              Errors
            </p>
            <h2 className="mt-2 text-3xl font-black">Problematic calls</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Failed or suspicious API calls from your connected projects. This
              view only includes responses with status 400 and above.
            </p>
          </div>

          <label className="grid gap-2 text-sm text-muted">
            Project filter
            <select
              className="rounded-2xl bg-panel-strong px-4 py-3 text-foreground outline-none ring-1 ring-line transition focus:ring-primary/60"
              onChange={(event) => setSelectedProjectId(event.target.value)}
              value={selectedProjectId}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-panel">
        <div className="grid grid-cols-[0.9fr_0.8fr_1.5fr_0.7fr_0.7fr_1fr] gap-3 border-b border-background px-5 py-4 text-xs uppercase tracking-[0.14em] text-muted">
          <span>Project</span>
          <span>Method</span>
          <span>Path</span>
          <span>Status</span>
          <span>Latency</span>
          <span>Time</span>
        </div>

        {isLoading ? <p className="p-5 text-sm text-muted">Loading errors...</p> : null}

        {!isLoading && visibleLogs.length === 0 ? (
          <p className="p-5 text-sm text-muted">
            No problematic calls saved yet.
          </p>
        ) : null}

        {visibleLogs.map((log) => (
          <div
            className="grid grid-cols-[0.9fr_0.8fr_1.5fr_0.7fr_0.7fr_1fr] gap-3 border-b border-background/70 px-5 py-4 text-sm text-foreground last:border-b-0"
            key={log.id}
          >
            <span className="truncate font-black">{log.projectName}</span>
            <span className="font-black">{log.method}</span>
            <span className="truncate text-muted" title={log.path}>
              {log.path}
            </span>
            <StatusBadge statusCode={log.statusCode} />
            <span>{log.durationMs} ms</span>
            <span className="text-muted">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  tone = "default",
  value
}: {
  label: string;
  tone?: "danger" | "default";
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-2 text-4xl font-black ${
          tone === "danger" ? "text-red-300" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  const className =
    statusCode >= 500
      ? "bg-red-500/15 text-red-300"
      : "bg-yellow-500/15 text-yellow-200";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {statusCode}
    </span>
  );
}
