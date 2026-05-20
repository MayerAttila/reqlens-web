"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type VisibleRequestLog = RequestLog & {
  latencyErrorThresholdMs: number;
  projectName: string;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const requestColumns: Array<DataTableColumn<VisibleRequestLog>> = [
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

export function RequestsPanel() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [requestSearch, setRequestSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam ?? "all"
  );

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
          project.logs.map((log) => ({
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
  const filteredLogs = useMemo(
    () =>
      filterRows(
        visibleLogs,
        requestSearch,
        (log) =>
          `${log.projectName} ${log.method} ${log.path} ${log.statusCode} ${log.durationMs}`
      ),
    [requestSearch, visibleLogs]
  );
  const totalRequests = projects.reduce(
    (count, project) => count + project.logs.length,
    0
  );
  const successfulRequests = projects.reduce(
    (count, project) =>
      count + project.logs.filter((log) => log.statusCode < 400).length,
    0
  );
  const problemRequests = totalRequests - successfulRequests;
  const slowRequests = projects.reduce(
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
  const averageLatency = totalRequests
    ? Math.round(
        projects.reduce(
          (total, project) =>
            total +
            project.logs.reduce((projectTotal, log) => projectTotal + log.durationMs, 0),
          0
        ) / totalRequests
      )
    : 0;

  useEffect(() => {
    void loadLogs();
  }, []);

  useEffect(() => {
    setSelectedProjectId(projectIdParam ?? "all");
  }, [projectIdParam]);

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
    } catch {
      toast.error("Could not load logs.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          label="Requests"
          value={totalRequests}
        />
        <SummaryCard label="Successful" value={successfulRequests} />
        <SummaryCard
          href="/dashboard/errors"
          label="Problem calls"
          linkLabel="View problems"
          tone="danger"
          value={problemRequests}
        />
        <SummaryCard
          href="/dashboard/errors?type=latency"
          label="Latency alerts"
          linkLabel="View slow calls"
          tone={slowRequests ? "warning" : "default"}
          value={slowRequests}
        />
        <SummaryCard label="Avg latency" value={`${averageLatency} ms`} />
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
            onChange={(event) => setRequestSearch(event.target.value)}
            onClear={() => setRequestSearch("")}
            placeholder="Search requests..."
            value={requestSearch}
          />
        </div>
        <DataTable
          columns={requestColumns}
          emptyText={
            requestSearch
              ? "No matching rows found."
              : "No requests saved yet."
          }
          getRowKey={(log) => log.id}
          gridTemplateColumns="0.9fr 0.8fr 1.5fr 0.7fr 0.7fr 1fr"
          isLoading={isLoading}
          items={filteredLogs}
          loadingText="Loading requests..."
          storageKey="reqlens:requests-table-widths"
        />
      </section>
    </div>
  );
}

function SummaryCard({
  helperText,
  href,
  label,
  linkLabel,
  tone = "default",
  value
}: {
  helperText?: string;
  href?: string;
  label: string;
  linkLabel?: string;
  tone?: "danger" | "default" | "warning";
  value: number | string;
}) {
  const content = (
    <>
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
      {helperText ? <p className="mt-2 text-xs text-muted">{helperText}</p> : null}
      {href ? (
        <p className="mt-4 text-xs font-black text-muted">
          {linkLabel ?? "Open"} →
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        className="rounded-3xl bg-panel p-5 transition hover:-translate-y-0.5 hover:bg-surface"
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-3xl bg-panel p-5">
      {content}
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
