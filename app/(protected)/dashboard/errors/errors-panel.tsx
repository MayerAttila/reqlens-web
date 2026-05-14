"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  DataTable,
  DataTableColumn
} from "../../../../components/ui/data-table";
import {
  defaultLatencyErrorThresholdMs,
  LatencyBadge,
  StatusBadge
} from "../../../../components/ui/request-badges";
import { SearchInput } from "../../../../components/ui/search-input";

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
  settings?: {
    latencyErrorThresholdMs: number;
  };
  logs: RequestLog[];
};

type VisibleErrorLog = RequestLog & {
  latencyErrorThresholdMs: number;
  projectName: string;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const errorColumns: Array<DataTableColumn<VisibleErrorLog>> = [
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
    render: (log) => (
      <span className="block truncate text-muted" title={log.path}>
        {log.path}
      </span>
    )
  },
  {
    className: "whitespace-nowrap",
    header: "Status",
    render: (log) => <StatusBadge statusCode={log.statusCode} />
  },
  {
    className: "whitespace-nowrap",
    header: "Latency",
    render: (log) => (
      <LatencyBadge
        durationMs={log.durationMs}
        thresholdMs={log.latencyErrorThresholdMs}
      />
    )
  },
  {
    className: "whitespace-nowrap",
    header: "Time",
    render: (log) => (
      <span className="text-muted">{new Date(log.createdAt).toLocaleString()}</span>
    )
  }
];

export function ErrorsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [errorSearch, setErrorSearch] = useState("");
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
              latencyErrorThresholdMs:
                project.settings?.latencyErrorThresholdMs ??
                defaultLatencyErrorThresholdMs,
              projectName: project.projectName
            }))
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        ),
    [selectedProjects]
  );
  const filteredVisibleLogs = useMemo(
    () =>
      filterRows(
        visibleLogs,
        errorSearch,
        (log) =>
          `${log.projectName} ${log.method} ${log.path} ${log.statusCode} ${log.durationMs}`
      ),
    [errorSearch, visibleLogs]
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

      <section className="rounded-3xl bg-panel p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="grid gap-2 text-sm text-muted">
            <span className="sr-only">Project filter</span>
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
          <SearchInput
            className="w-full lg:max-w-sm"
            onChange={(event) => setErrorSearch(event.target.value)}
            onClear={() => setErrorSearch("")}
            placeholder="Search problematic calls..."
            value={errorSearch}
          />
        </div>
        <DataTable
          columns={errorColumns}
          emptyText={
            errorSearch
              ? "No matching rows found."
              : "No problematic calls saved yet."
          }
          getRowKey={(log) => log.id}
          gridTemplateColumns="0.9fr 0.8fr 1.5fr 0.7fr 0.7fr 1fr"
          isLoading={isLoading}
          items={filteredVisibleLogs}
          loadingText="Loading errors..."
          storageKey="reqlens:errors-table-widths"
        />
      </section>
    </div>
  );
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
