"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  DataTable,
  DataTableColumn
} from "../../../../components/ui/data-table";
import { DropdownSelect } from "../../../../components/ui/dropdown-select";
import {
  defaultLatencyErrorThresholdMs,
  isSlowRequest,
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
  requestBody: unknown;
  responseBody: unknown;
  createdAt: string;
};

type ProjectLogs = {
  projectId: string;
  projectName: string;
  hasApiKey: boolean;
  settings?: {
    errorEmailAudience: string;
    errorEmailCustomUserIds: string[];
    errorEmailEnabled: boolean;
    errorEmailRecipient: string | null;
    latencyEmailAudience: string;
    latencyEmailCustomUserIds: string[];
    latencyEmailEnabled: boolean;
    latencyEmailRecipient: string | null;
    latencyErrorThresholdMs: number;
  };
  logs: RequestLog[];
};

type VisibleErrorLog = RequestLog & {
  latencyErrorThresholdMs: number;
  projectName: string;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function ErrorsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [errorSearch, setErrorSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<VisibleErrorLog | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const errorColumns: Array<DataTableColumn<VisibleErrorLog>> = [
    {
      className: "min-w-0",
      header: "Project",
      render: (log) => (
        <span className="block truncate font-black">{log.projectName}</span>
      )
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
    },
    {
      className: "whitespace-nowrap",
      header: "Details",
      render: (log) => (
        <button
          className="rounded-xl bg-surface px-3 py-2 text-xs font-black text-foreground transition hover:bg-surface-soft"
          onClick={() => setSelectedLog(log)}
          type="button"
        >
          View
        </button>
      )
    }
  ];

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
            .filter((log) => {
              const latencyErrorThresholdMs =
                project.settings?.latencyErrorThresholdMs ??
                defaultLatencyErrorThresholdMs;

              return (
                log.statusCode >= 400 ||
                isSlowRequest(log.durationMs, latencyErrorThresholdMs)
              );
            })
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
      count +
      project.logs.filter((log) => {
        const latencyErrorThresholdMs =
          project.settings?.latencyErrorThresholdMs ??
          defaultLatencyErrorThresholdMs;

        return (
          log.statusCode >= 400 ||
          isSlowRequest(log.durationMs, latencyErrorThresholdMs)
        );
      }).length,
    0
  );
  const slowCalls = projects.reduce(
    (count, project) =>
      count +
      project.logs.filter((log) =>
        isSlowRequest(
          log.durationMs,
          project.settings?.latencyErrorThresholdMs ??
            defaultLatencyErrorThresholdMs
        )
      ).length,
    0
  );
  const serverErrors = projects.reduce(
    (count, project) =>
      count + project.logs.filter((log) => log.statusCode >= 500).length,
    0
  );

  useEffect(() => {
    void loadErrors();
  }, []);

  async function loadErrors() {
    try {
      const response = await fetch(`${apiUrl}/logs`, {
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
        <SummaryCard label="Latency alerts" value={slowCalls} tone="warning" />
        <SummaryCard label="Server errors" value={serverErrors} tone="danger" />
      </section>

      <section className="rounded-3xl bg-panel p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <DropdownSelect
              onChange={setSelectedProjectId}
              options={[
                { label: "All projects", value: "all" },
                ...projects.map((project) => ({
                  label: project.projectName,
                  value: project.projectId
                }))
              ]}
              value={selectedProjectId}
            />
          </div>
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
          gridTemplateColumns="0.9fr 0.7fr 1.4fr 0.7fr 0.7fr 1fr 0.6fr"
          isLoading={isLoading}
          items={filteredVisibleLogs}
          loadingText="Loading errors..."
          storageKey="reqlens:errors-table-widths"
        />
      </section>
      {selectedLog ? (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      ) : null}
    </div>
  );
}

function LogDetailsModal({
  log,
  onClose
}: {
  log: VisibleErrorLog;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-panel p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Problem payload
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {log.method} {log.path}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {log.projectName} · status {log.statusCode} · {log.durationMs} ms
            </p>
          </div>
          <button
            className="rounded-2xl bg-surface px-4 py-2 text-sm font-black text-muted transition hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PayloadPanel label="Request body" value={log.requestBody} />
          <PayloadPanel label="Response body" value={log.responseBody} />
        </div>
      </div>
    </div>
  );
}

function PayloadPanel({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl bg-panel-strong p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-background p-4 text-xs leading-6 text-foreground">
        {formatPayload(value)}
      </pre>
    </div>
  );
}

function formatPayload(value: unknown) {
  if (value === null || value === undefined) {
    return "No payload captured.";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
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
  tone?: "danger" | "default" | "warning";
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-2 text-4xl font-black ${
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
