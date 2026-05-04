"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  DataTable,
  DataTableColumn
} from "../ui/data-table";
import { ButtonLink } from "../ui/button";
import { MetricGrid } from "../ui/metric-grid";
import { SearchInput } from "../ui/search-input";

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

type RecentRequest = RequestLog & {
  projectName: string;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const recentRequestColumns: Array<DataTableColumn<RecentRequest>> = [
  {
    className: "min-w-0",
    header: "Project",
    render: (log) => <span className="block truncate font-black">{log.projectName}</span>
  },
  {
    header: "Method",
    render: (log) => <span className="font-black">{log.method}</span>
  },
  {
    className: "min-w-0",
    header: "Path",
    render: (log) => <span className="block truncate text-muted">{log.path}</span>
  },
  {
    className: "whitespace-nowrap",
    header: "Status",
    render: (log) => <StatusBadge statusCode={log.statusCode} />
  },
  {
    className: "whitespace-nowrap",
    header: "Time",
    render: (log) => (
      <span className="text-muted">{new Date(log.createdAt).toLocaleString()}</span>
    )
  }
];

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [recentSearch, setRecentSearch] = useState("");

  useEffect(() => {
    void loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await fetch(`${apiUrl}/logs`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const data = (await response.json()) as { projects: ProjectLogs[] };
      setProjects(data.projects);
    } catch {
      toast.error("Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }

  const allLogs = useMemo(
    () =>
      projects.flatMap((project) =>
        project.logs.map((log) => ({
          ...log,
          projectName: project.projectName
        }))
      ),
    [projects]
  );
  const recentRequests = useMemo(
    () =>
      [...allLogs]
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        )
        .slice(0, 10),
    [allLogs]
  );
  const filteredRecentRequests = useMemo(
    () =>
      filterRows(
        recentRequests,
        recentSearch,
        (log) => `${log.projectName} ${log.method} ${log.path} ${log.statusCode}`
      ),
    [recentRequests, recentSearch]
  );
  const todayLogs = allLogs.filter((log) => isToday(log.createdAt));
  const todayErrors = todayLogs.filter((log) => log.statusCode >= 400);
  const averageLatency = todayLogs.length
    ? Math.round(
        todayLogs.reduce((total, log) => total + log.durationMs, 0) /
          todayLogs.length
      )
    : 0;
  const latestErrors = recentRequests
    .filter((log) => log.statusCode >= 400)
    .slice(0, 5);
  const clientErrors = latestErrors.filter(
    (log) => log.statusCode >= 400 && log.statusCode < 500
  ).length;
  const serverErrors = latestErrors.filter((log) => log.statusCode >= 500).length;

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-panel p-6 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          Dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black">Backend health overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Quick view of project traffic, latency, and problematic calls from
              the latest ingested request logs.
            </p>
          </div>
          <ButtonLink href="/dashboard/projects">Create project</ButtonLink>
        </div>
      </section>

      <MetricGrid
        blocks={[
          { label: "Projects", value: projects.length },
          { label: "Requests today", value: todayLogs.length },
          {
            label: "Problem calls today",
            tone: "danger",
            value: todayErrors.length
          },
          { label: "Avg latency today", value: `${averageLatency} ms` }
        ]}
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-3xl bg-panel p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Recent requests</h2>
              <p className="mt-1 text-sm text-muted">
                {recentSearch
                  ? `${filteredRecentRequests.length} matching request${
                      filteredRecentRequests.length === 1 ? "" : "s"
                    } across all projects.`
                  : `Latest ${recentRequests.length} request${
                      recentRequests.length === 1 ? "" : "s"
                    } across all projects.`}
              </p>
            </div>
            <SearchInput
              className="w-full lg:max-w-sm"
              onChange={(event) => setRecentSearch(event.target.value)}
              onClear={() => setRecentSearch("")}
              placeholder="Search recent requests..."
              value={recentSearch}
            />
          </div>

          <DataTable
            columns={recentRequestColumns}
            emptyText={recentSearch ? "No matching rows found." : "No requests saved yet."}
            getRowKey={(log) => log.id}
            gridTemplateColumns="1fr 0.7fr 1.4fr 0.7fr 1.2fr"
            isLoading={isLoading}
            items={filteredRecentRequests}
            loadingText="Loading requests..."
            storageKey="reqlens:dashboard-recent-table-widths"
          />
        </div>

        <div className="grid min-w-0 gap-6">
          <section className="rounded-3xl bg-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Error snapshot</h2>
                <p className="mt-1 text-sm text-muted">
                  Latest problematic calls.
                </p>
              </div>
              <ButtonLink href="/dashboard/errors" variant="secondary">
                Errors
              </ButtonLink>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label="4xx" value={clientErrors} />
              <MiniStat label="5xx" tone="danger" value={serverErrors} />
            </div>

            <div className="mt-5 grid gap-2">
              {latestErrors.length ? (
                latestErrors.map((log) => (
                  <div
                    className="rounded-2xl bg-panel-strong p-3 text-sm"
                    key={log.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-black">{log.projectName}</span>
                      <StatusBadge statusCode={log.statusCode} />
                    </div>
                    <p className="mt-2 truncate text-muted">
                      {log.method} {log.path}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-panel-strong p-4 text-sm text-muted">
                  No problematic calls in the latest logs.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-3xl bg-panel p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Project health</h2>
            <p className="mt-1 text-sm text-muted">
              One card per backend project, based on latest saved logs.
            </p>
          </div>
          <ButtonLink href="/dashboard/projects" variant="secondary">
            Manage projects
          </ButtonLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? <p className="text-sm text-muted">Loading projects...</p> : null}
          {!isLoading && projects.length === 0 ? (
            <p className="rounded-2xl bg-panel-strong p-4 text-sm text-muted">
              No projects yet. Create a project and connect the middleware first.
            </p>
          ) : null}
          {projects.map((project) => (
            <ProjectHealthCard key={project.projectId} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  tone = "default",
  value
}: {
  label: string;
  tone?: "danger" | "default";
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-panel-strong p-4">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          tone === "danger" ? "text-red-300" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProjectHealthCard({ project }: { project: ProjectLogs }) {
  const errorCount = project.logs.filter((log) => log.statusCode >= 400).length;
  const latestLog = [...project.logs].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  )[0];
  const health =
    project.logs.length === 0
      ? "No traffic"
      : errorCount > 0
        ? "Has errors"
        : "Healthy";
  const healthClass =
    health === "Healthy"
      ? "bg-primary/15 text-primary-soft"
      : health === "Has errors"
        ? "bg-red-500/15 text-red-300"
        : "bg-surface text-muted";

  return (
    <article className="rounded-3xl bg-panel-strong p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black">{project.projectName}</h3>
          <p className="mt-1 text-xs text-muted">
            {project.hasApiKey ? "API key active" : "No API key"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${healthClass}`}>
          {health}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <MiniHealthStat label="Requests" value={project.logs.length} />
        <MiniHealthStat label="Errors" value={errorCount} />
        <MiniHealthStat
          label="Last"
          value={latestLog ? formatShortTime(latestLog.createdAt) : "-"}
        />
      </div>
    </article>
  );
}

function MiniHealthStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-black">{value}</p>
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

function isToday(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatShortTime(dateValue: string) {
  return new Date(dateValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function filterRows<TItem>(
  items: TItem[],
  query: string,
  getSearchText: (item: TItem) => string
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    getSearchText(item).toLowerCase().includes(normalizedQuery)
  );
}
