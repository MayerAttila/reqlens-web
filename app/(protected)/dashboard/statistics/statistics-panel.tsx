"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DropdownSelect } from "../../../../components/ui/dropdown-select";
import { MetricGrid } from "../../../../components/ui/metric-grid";
import {
  defaultLatencyErrorThresholdMs,
  isSlowRequest
} from "../../../../components/ui/request-badges";

type RequestLog = {
  createdAt: string;
  durationMs: number;
  id: string;
  method: string;
  path: string;
  statusCode: number;
};

type ProjectLogs = {
  logs: RequestLog[];
  projectId: string;
  projectName: string;
  settings?: {
    latencyErrorThresholdMs: number;
  };
};

type VisibleLog = RequestLog & {
  latencyErrorThresholdMs: number;
  projectId: string;
  projectName: string;
};

type DistributionItem = {
  count: number;
  label: string;
  tone?: "danger" | "default" | "muted" | "warning";
};

type RouteStat = {
  averageLatency: number;
  errorCount: number;
  key: string;
  method: string;
  path: string;
  requestCount: number;
  slowCount: number;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function StatisticsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");

  useEffect(() => {
    void loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await fetch(`${apiUrl}/logs`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load request statistics.");
      }

      const data = (await response.json()) as { projects: ProjectLogs[] };
      setProjects(data.projects);
    } catch {
      toast.error("Could not load request statistics.");
    } finally {
      setIsLoading(false);
    }
  }

  const visibleLogs = useMemo(
    () =>
      projects
        .filter(
          (project) =>
            selectedProjectId === "all" || project.projectId === selectedProjectId
        )
        .flatMap((project) =>
          project.logs.map((log) => ({
            ...log,
            latencyErrorThresholdMs:
              project.settings?.latencyErrorThresholdMs ??
              defaultLatencyErrorThresholdMs,
            projectId: project.projectId,
            projectName: project.projectName
          }))
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        ),
    [projects, selectedProjectId]
  );

  const totalRequests = visibleLogs.length;
  const errorCount = visibleLogs.filter((log) => log.statusCode >= 400).length;
  const slowCount = visibleLogs.filter((log) =>
    isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
  ).length;
  const averageLatency = average(visibleLogs.map((log) => log.durationMs));
  const p95Latency = percentile(
    visibleLogs.map((log) => log.durationMs),
    0.95
  );
  const errorRate = formatPercent(errorCount, totalRequests);
  const statusDistribution = getStatusDistribution(visibleLogs);
  const methodDistribution = getCountDistribution(
    visibleLogs,
    (log) => log.method
  );
  const trafficBuckets = getTrafficBuckets(visibleLogs);
  const routeStats = getRouteStats(visibleLogs).slice(0, 8);
  const projectStats = getProjectStats(visibleLogs).slice(0, 6);
  const sampleWindow = getSampleWindow(visibleLogs);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-panel p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Statistics
          </p>
          <h1 className="mt-2 text-3xl font-black text-foreground">
            Request performance
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isLoading
              ? "Loading request sample..."
              : sampleWindow ?? "No request sample yet."}
          </p>
        </div>
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
      </section>

      <MetricGrid
        blocks={[
          {
            helperText: "Recent tracked sample",
            label: "Requests",
            value: totalRequests
          },
          {
            helperText: `${errorCount} errored calls`,
            label: "Error rate",
            tone: errorCount ? "danger" : "default",
            value: errorRate
          },
          {
            helperText: `${averageLatency} ms average`,
            label: "P95 latency",
            value: `${p95Latency} ms`
          },
          {
            helperText: "Over project latency limits",
            label: "Slow calls",
            value: slowCount
          }
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <Panel
          empty={!trafficBuckets.length}
          emptyText="No request volume to chart yet."
          title="Traffic"
        >
          <div className="grid min-h-64 grid-cols-6 items-end gap-2 sm:grid-cols-12">
            {trafficBuckets.map((bucket) => (
              <div className="grid min-w-0 gap-2" key={bucket.key}>
                <div className="flex h-52 items-end rounded-2xl bg-background/45 p-1.5">
                  <div
                    className="w-full rounded-xl bg-primary transition"
                    style={{ height: `${bucket.height}%` }}
                    title={`${bucket.count} requests`}
                  />
                </div>
                <div className="min-w-0 text-center">
                  <p className="truncate text-xs font-black text-foreground">
                    {bucket.count}
                  </p>
                  <p className="truncate text-[11px] text-muted">{bucket.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <DistributionPanel
            emptyText="No statuses yet."
            items={statusDistribution}
            title="Status mix"
          />
          <DistributionPanel
            emptyText="No methods yet."
            items={methodDistribution}
            title="Method mix"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <Panel
          empty={!routeStats.length}
          emptyText="No routes tracked yet."
          title="Busiest routes"
        >
          <div className="grid gap-2">
            {routeStats.map((route) => (
              <div
                className="grid gap-3 rounded-2xl bg-panel-strong px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_repeat(3,auto)] sm:items-center"
                key={route.key}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-foreground">
                    {route.method} {route.path}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {route.averageLatency} ms average
                  </p>
                </div>
                <StatPill label="Calls" value={route.requestCount} />
                <StatPill label="Errors" tone="danger" value={route.errorCount} />
                <StatPill label="Slow" tone="warning" value={route.slowCount} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          empty={!projectStats.length}
          emptyText="No project statistics yet."
          title="Projects"
        >
          <div className="grid gap-2">
            {projectStats.map((project) => (
              <div className="rounded-2xl bg-panel-strong px-4 py-3" key={project.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-foreground">
                      {project.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {project.averageLatency} ms avg latency
                    </p>
                  </div>
                  <p className="text-2xl font-black text-foreground">
                    {project.requestCount}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <StatPill label="Errors" tone="danger" value={project.errorCount} />
                  <StatPill label="Slow" tone="warning" value={project.slowCount} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  children,
  empty,
  emptyText,
  title
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-3xl bg-panel p-6">
      <h2 className="text-xl font-black text-foreground">{title}</h2>
      {empty ? (
        <p className="mt-4 rounded-2xl bg-panel-strong p-4 text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5">{children}</div>
      )}
    </section>
  );
}

function DistributionPanel({
  emptyText,
  items,
  title
}: {
  emptyText: string;
  items: DistributionItem[];
  title: string;
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Panel empty={!items.length} emptyText={emptyText} title={title}>
      <div className="grid gap-3">
        {items.map((item) => (
          <div className="grid gap-1.5" key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-black text-foreground">{item.label}</span>
              <span className="text-muted">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background/60">
              <div
                className={`h-full rounded-full ${distributionToneClass(item.tone)}`}
                style={{ width: `${Math.max((item.count / maxCount) * 100, 5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatPill({
  label,
  tone = "default",
  value
}: {
  label: string;
  tone?: "danger" | "default" | "warning";
  value: number;
}) {
  return (
    <div
      className={`min-w-[4.5rem] rounded-xl px-3 py-2 ${
        tone === "danger"
          ? "bg-red-500/10 text-red-200"
          : tone === "warning"
            ? "bg-orange-500/10 text-orange-100"
            : "bg-surface text-foreground"
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function percentile(values: number[], quantile: number) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((first, second) => first - second);
  const index = Math.ceil(sorted.length * quantile) - 1;

  return sorted[Math.max(index, 0)];
}

function formatPercent(count: number, total: number) {
  if (!total) {
    return "0%";
  }

  return `${Math.round((count / total) * 1000) / 10}%`;
}

function getStatusDistribution(logs: VisibleLog[]): DistributionItem[] {
  const groups = [
    {
      count: logs.filter((log) => log.statusCode >= 200 && log.statusCode < 400)
        .length,
      label: "2xx / 3xx",
      tone: "default" as const
    },
    {
      count: logs.filter((log) => log.statusCode >= 400 && log.statusCode < 500)
        .length,
      label: "4xx",
      tone: "warning" as const
    },
    {
      count: logs.filter((log) => log.statusCode >= 500).length,
      label: "5xx",
      tone: "danger" as const
    }
  ];

  return groups.filter((group) => group.count > 0);
}

function getCountDistribution<TItem>(
  items: TItem[],
  getLabel: (item: TItem) => string
): DistributionItem[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = getLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ count, label }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 6);
}

function getTrafficBuckets(logs: VisibleLog[]) {
  const counts = new Map<number, number>();

  for (const log of logs) {
    const date = new Date(log.createdAt);
    date.setMinutes(0, 0, 0);
    const key = date.getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const buckets = [...counts.entries()]
    .sort(([first], [second]) => first - second)
    .slice(-12);
  const maxCount = Math.max(...buckets.map(([, count]) => count), 1);

  return buckets.map(([key, count]) => ({
    count,
    height: Math.max((count / maxCount) * 100, 8),
    key,
    label: new Date(key).toLocaleTimeString([], {
      hour: "numeric"
    })
  }));
}

function getRouteStats(logs: VisibleLog[]): RouteStat[] {
  const grouped = new Map<string, VisibleLog[]>();

  for (const log of logs) {
    const key = `${log.method} ${log.path}`;
    grouped.set(key, [...(grouped.get(key) ?? []), log]);
  }

  return [...grouped.entries()]
    .map(([key, routeLogs]) => ({
      averageLatency: average(routeLogs.map((log) => log.durationMs)),
      errorCount: routeLogs.filter((log) => log.statusCode >= 400).length,
      key,
      method: routeLogs[0].method,
      path: routeLogs[0].path,
      requestCount: routeLogs.length,
      slowCount: routeLogs.filter((log) =>
        isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
      ).length
    }))
    .sort((first, second) => second.requestCount - first.requestCount);
}

function getProjectStats(logs: VisibleLog[]) {
  const grouped = new Map<string, VisibleLog[]>();

  for (const log of logs) {
    grouped.set(log.projectId, [...(grouped.get(log.projectId) ?? []), log]);
  }

  return [...grouped.entries()]
    .map(([id, projectLogs]) => ({
      averageLatency: average(projectLogs.map((log) => log.durationMs)),
      errorCount: projectLogs.filter((log) => log.statusCode >= 400).length,
      id,
      name: projectLogs[0].projectName,
      requestCount: projectLogs.length,
      slowCount: projectLogs.filter((log) =>
        isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
      ).length
    }))
    .sort((first, second) => second.requestCount - first.requestCount);
}

function getSampleWindow(logs: VisibleLog[]) {
  if (!logs.length) {
    return null;
  }

  const times = logs.map((log) => new Date(log.createdAt).getTime());
  const oldest = new Date(Math.min(...times));
  const newest = new Date(Math.max(...times));

  return `Recent sample from ${oldest.toLocaleString()} to ${newest.toLocaleString()}.`;
}

function distributionToneClass(tone: DistributionItem["tone"]) {
  if (tone === "danger") {
    return "bg-red-300";
  }

  if (tone === "warning") {
    return "bg-orange-200";
  }

  if (tone === "muted") {
    return "bg-muted";
  }

  return "bg-primary";
}
