"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  DataTable,
  DataTableColumn
} from "../ui/data-table";
import { ButtonLink } from "../ui/button";
import { MetricGrid } from "../ui/metric-grid";
import {
  defaultLatencyErrorThresholdMs,
  isSlowRequest,
  LatencyBadge,
  StatusBadge
} from "../ui/request-badges";
import { SearchInput } from "../ui/search-input";
import { useRequestLogEvents } from "./use-request-log-events";

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

type RecentRequest = RequestLog & {
  latencyErrorThresholdMs: number;
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

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [recentSearch, setRecentSearch] = useState("");

  useEffect(() => {
    void loadLogs();
  }, []);

  useRequestLogEvents(() => {
    void loadLogs();
  });

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
          latencyErrorThresholdMs:
            project.settings?.latencyErrorThresholdMs ??
            defaultLatencyErrorThresholdMs,
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
        .slice(0, 20),
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
  const todaySlowRequests = todayLogs.filter((log) =>
    isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
  );
  const averageLatency = todayLogs.length
    ? Math.round(
        todayLogs.reduce((total, log) => total + log.durationMs, 0) /
          todayLogs.length
      )
    : 0;
  const latestProblematicCalls = useMemo(
    () =>
      [...allLogs]
        .filter(
          (log) =>
            log.statusCode >= 400 ||
            isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        )
        .slice(0, 12),
    [allLogs]
  );

  return (
    <div className="grid gap-6">
      <MetricGrid
        blocks={[
          {
            href: "/dashboard/projects",
            label: "Projects",
            linkLabel: "View projects",
            value: projects.length
          },
          {
            href: "/dashboard/requests",
            label: "Requests today",
            linkLabel: "View requests",
            value: todayLogs.length
          },
          {
            href: "/dashboard/errors?type=errors",
            label: "Problem calls today",
            linkLabel: "View errors",
            tone: "danger",
            value: todayErrors.length
          },
          {
            href: "/dashboard/errors?type=latency",
            label: "Latency alerts today",
            linkLabel: "View slow calls",
            tone: todaySlowRequests.length ? "danger" : "default",
            value: todaySlowRequests.length
          }
        ]}
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_30rem]">
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
            gridTemplateColumns="1fr 0.7fr 1.4fr 0.7fr 0.8fr 1.2fr"
            isLoading={isLoading}
            items={filteredRecentRequests}
            loadingText="Loading requests..."
            showPagination={false}
            storageKey="reqlens:dashboard-recent-table-widths"
          />
        </div>

        <section className="min-w-0 rounded-3xl bg-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Recent problematic calls</h2>
            <ButtonLink href="/dashboard/errors" variant="secondary">
              Open
            </ButtonLink>
          </div>

          <div className="mt-5 grid gap-2">
            {latestProblematicCalls.length ? (
              latestProblematicCalls.map((log) => {
                const isSlow = isSlowRequest(
                  log.durationMs,
                  log.latencyErrorThresholdMs
                );

                return (
                  <div
                    className="rounded-2xl bg-panel-strong p-3 text-sm"
                    key={log.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-black">{log.projectName}</span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="flex items-center gap-2">
                          {log.statusCode >= 400 ? (
                            <StatusBadge statusCode={log.statusCode} />
                          ) : null}
                          {isSlow ? (
                            <LatencyBadge
                              durationMs={log.durationMs}
                              thresholdMs={log.latencyErrorThresholdMs}
                            />
                          ) : null}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 text-muted">
                      <span className="min-w-0 truncate leading-5">
                        {log.method} {log.path}
                      </span>
                      <span className="whitespace-nowrap text-right leading-5">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl bg-panel-strong p-4 text-sm text-muted">
                No problematic calls in the latest logs.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
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
