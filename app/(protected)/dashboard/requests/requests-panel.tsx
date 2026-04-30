"use client";

import { useEffect, useState } from "react";
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

export function RequestsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const selectedProject =
    projects.find((project) => project.projectId === selectedProjectId) ?? projects[0];

  useEffect(() => {
    void loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await fetch(`${apiUrl}/logs`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load logs.");
      }

      const data = (await response.json()) as { projects: ProjectLogs[] };
      setProjects(data.projects);
      setSelectedProjectId((current) => current || data.projects[0]?.projectId || "");
    } catch {
      toast.error("Could not load logs.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          Requests
        </p>
        <h2 className="mt-2 text-3xl font-black">Requests by project</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Saved API request logs grouped by project. Since each project owns one
          API key, this shows the traffic received through each key.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.32fr_1fr]">
        <aside className="rounded-3xl bg-panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black">Projects</h3>
            <span className="rounded-full bg-surface px-3 py-1 text-sm text-muted">
              {projects.length}
            </span>
          </div>

          <div className="grid gap-2">
            {isLoading ? <p className="text-sm text-muted">Loading...</p> : null}
            {!isLoading && projects.length === 0 ? (
              <p className="rounded-2xl bg-panel-strong p-4 text-sm text-muted">
                No projects yet.
              </p>
            ) : null}
            {projects.map((project) => (
              <button
                className={`rounded-2xl p-4 text-left transition ${
                  project.projectId === selectedProject?.projectId
                    ? "bg-primary text-white"
                    : "bg-panel-strong text-foreground hover:bg-surface"
                }`}
                key={project.projectId}
                onClick={() => setSelectedProjectId(project.projectId)}
                type="button"
              >
                <p className="font-black">{project.projectName}</p>
                <p
                  className={`mt-1 text-xs ${
                    project.projectId === selectedProject?.projectId
                      ? "text-white/70"
                      : "text-muted"
                  }`}
                >
                  {project.logs.length} request{project.logs.length === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-3xl bg-panel p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-black">
                {selectedProject?.projectName ?? "No project selected"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                Latest 100 saved requests for this project.
              </p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm text-muted">
              {selectedProject?.hasApiKey ? "API key active" : "No API key"}
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-panel-strong">
            <div className="grid grid-cols-[0.8fr_1.4fr_0.7fr_0.7fr_1fr] gap-3 border-b border-background px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted">
              <span>Method</span>
              <span>Path</span>
              <span>Status</span>
              <span>Latency</span>
              <span>Time</span>
            </div>

            {selectedProject?.logs.length ? (
              selectedProject.logs.map((log) => (
                <div
                  className="grid grid-cols-[0.8fr_1.4fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-3 text-sm text-foreground"
                  key={log.id}
                >
                  <span className="font-black">{log.method}</span>
                  <span className="truncate text-muted">{log.path}</span>
                  <StatusBadge statusCode={log.statusCode} />
                  <span>{log.durationMs} ms</span>
                  <span className="text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-muted">
                No requests saved for this project yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  const className =
    statusCode >= 500
      ? "bg-red-500/15 text-red-300"
      : statusCode >= 400
        ? "bg-yellow-500/15 text-yellow-200"
        : "bg-primary/15 text-primary-soft";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {statusCode}
    </span>
  );
}
