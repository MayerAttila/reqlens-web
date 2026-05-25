"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
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

type TrafficBucket = {
  errors: number;
  healthy: number;
  key: number;
  label: string;
  slow: number;
  total: number;
};

type TimeframeValue = "12h" | "24h" | "7d" | "30d";
type TrafficSeriesKey = "errors" | "healthy" | "slow";
type TrafficBucketUnit = "day" | "hour";

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const timeframeOptions: Array<{ label: string; value: TimeframeValue }> = [
  { label: "Last 12 hours", value: "12h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" }
];
const trafficSeries: Array<{
  fill: string;
  key: TrafficSeriesKey;
  label: string;
  stroke: string;
}> = [
  {
    fill: "#6f63ff",
    key: "healthy",
    label: "Healthy",
    stroke: "#8178ff"
  },
  {
    fill: "#ffd166",
    key: "slow",
    label: "Slow",
    stroke: "#ffd166"
  },
  {
    fill: "#ff5b73",
    key: "errors",
    label: "Errors",
    stroke: "#ff6b80"
  }
];

export function StatisticsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLogs[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeframeValue>("24h");

  useEffect(() => {
    void loadLogs();
  }, [selectedTimeframe]);

  async function loadLogs() {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        since: getTimeframeStart(selectedTimeframe).toISOString()
      });
      const response = await fetch(`${apiUrl}/logs?${params.toString()}`, {
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
  const trafficBuckets = getTrafficBuckets(visibleLogs, selectedTimeframe);
  const routeStats = getRouteStats(visibleLogs).slice(0, 5);
  const projectStats = getProjectStats(visibleLogs).slice(0, 6);
  const sampleWindow = getSampleWindow(visibleLogs);
  const requestHref = getDashboardHref("/dashboard/requests", selectedProjectId);
  const errorHref = getDashboardHref("/dashboard/errors", selectedProjectId, {
    type: "errors"
  });
  const latencyHref = getDashboardHref("/dashboard/errors", selectedProjectId, {
    type: "latency"
  });

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
            href: requestHref,
            label: "Requests",
            linkLabel: "View requests",
            value: totalRequests
          },
          {
            href: errorHref,
            label: "Errors",
            linkLabel: "View errors",
            tone: errorCount ? "danger" : "default",
            value: errorCount
          },
          {
            href: latencyHref,
            label: "Latency alerts",
            linkLabel: "View slow calls",
            value: slowCount
          },
          {
            label: "Error rate",
            tone: errorCount ? "danger" : "default",
            value: errorRate
          }
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <Panel
          action={
            <div className="w-44">
              <DropdownSelect
                onChange={setSelectedTimeframe}
                options={timeframeOptions}
                size="sm"
                value={selectedTimeframe}
              />
            </div>
          }
          empty={!trafficBuckets.length}
          emptyText="No request volume to chart yet."
          title="Traffic"
        >
          <TrafficChart data={trafficBuckets} />
          <TrafficSummaryCards data={trafficBuckets} />
        </Panel>

        <div className="grid gap-6">
          <StatusMixPanel
            emptyText="No statuses yet."
            items={statusDistribution}
            title="Status mix"
          />
          <MethodMixPanel
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
                  <p className="min-w-0 truncate font-black text-foreground">
                    {project.name}
                  </p>
                  <p className="shrink-0 text-right text-sm font-black text-muted">
                    {project.requestCount} requests
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <StatPill
                    label="Errors"
                    meta={formatPercent(project.errorCount, project.requestCount)}
                    tone="danger"
                    value={project.errorCount}
                  />
                  <StatPill
                    label="Slow"
                    meta={`${project.averageLatency} ms`}
                    tone="warning"
                    value={project.slowCount}
                  />
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
  action,
  children,
  empty,
  emptyText,
  title
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-3xl bg-panel p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        {action}
      </div>
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

function StatusMixPanel({
  emptyText,
  items,
  title
}: {
  emptyText: string;
  items: DistributionItem[];
  title: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Panel empty={!items.length} emptyText={emptyText} title={title}>
      <div className="grid gap-4">
        <div className="h-4 overflow-hidden rounded-full bg-background/60">
          <div className="flex h-full w-full">
            {items.map((item) => (
              <div
                className={statusMixSegmentClass(item.tone)}
                key={item.label}
                style={{ width: `${Math.max((item.count / total) * 100, 2)}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {items.map((item) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl bg-background/45 px-3 py-2 text-sm"
              key={item.label}
            >
              <span className="inline-flex min-w-0 items-center gap-2 font-black text-foreground">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${statusMixDotClass(
                    item.tone
                  )}`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-muted">
                {item.count} / {formatPercent(item.count, total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MethodMixPanel({
  emptyText,
  items,
  title
}: {
  emptyText: string;
  items: DistributionItem[];
  title: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Panel empty={!items.length} emptyText={emptyText} title={title}>
      <div className="grid gap-5 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1fr)] sm:items-center xl:grid-cols-1 2xl:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1fr)]">
        <div className="relative h-44 min-w-0">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={items}
                dataKey="count"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={3}
                stroke="none"
              >
                {items.map((item, index) => (
                  <Cell fill={methodMixColor(index)} key={item.label} />
                ))}
              </Pie>
              <Tooltip content={<MethodMixTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-2xl font-black text-foreground">{total}</p>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">
                Calls
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          {items.map((item, index) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl bg-background/45 px-3 py-2 text-sm"
              key={item.label}
            >
              <span className="inline-flex min-w-0 items-center gap-2 font-black text-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: methodMixColor(index) }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-muted">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MethodMixTooltip({
  active,
  payload,
  total
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    payload?: DistributionItem;
    value?: number;
  }>;
  total: number;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  const value = Number(payload[0].value ?? 0);

  if (!item) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm shadow-2xl shadow-black/35">
      <p className="font-black text-foreground">{item.label}</p>
      <p className="mt-1 text-xs text-muted">
        {value} calls / {formatPercent(value, total)}
      </p>
    </div>
  );
}

function TrafficSummaryCards({ data }: { data: TrafficBucket[] }) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {trafficSeries.map((series) => (
        <TrafficSummaryCard
          color={series.stroke}
          data={data}
          dataKey={series.key}
          fill={series.fill}
          key={series.key}
          label={series.label}
        />
      ))}
    </div>
  );
}

function TrafficSummaryCard({
  color,
  data,
  dataKey,
  fill,
  label
}: {
  color: string;
  data: TrafficBucket[];
  dataKey: TrafficSeriesKey;
  fill: string;
  label: string;
}) {
  const total = data.reduce((sum, bucket) => sum + bucket[dataKey], 0);
  const gradientId = `traffic-mini-${dataKey}`;

  return (
    <div className="grid min-h-24 grid-cols-[minmax(0,0.8fr)_minmax(5.5rem,1fr)] gap-3 rounded-2xl bg-background/45 p-4">
      <div className="min-w-0 self-center">
        <p className="truncate text-xs font-black text-muted">{label}</p>
        <p className="mt-3 text-2xl font-black text-foreground">
          {formatCompactNumber(total)}
        </p>
      </div>
      <div className="h-16 min-w-0 self-end">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={fill} stopOpacity={0.45} />
                <stop offset="95%" stopColor={fill} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <Area
              dataKey={dataKey}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              stroke={color}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrafficChart({ data }: { data: TrafficBucket[] }) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ bottom: 0, left: -24, right: 8, top: 10 }}>
          <defs>
            <linearGradient id="trafficHealthy" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#6f63ff" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#6f63ff" stopOpacity={0.72} />
            </linearGradient>
            <linearGradient id="trafficSlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ffd166" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#ffd166" stopOpacity={0.72} />
            </linearGradient>
            <linearGradient id="trafficErrors" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ff5b73" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#ff5b73" stopOpacity={0.72} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#303136" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#96969a", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "#96969a", fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            content={<TrafficTooltip />}
            cursor={{ stroke: "#57575d", strokeDasharray: "4 4" }}
          />
          <Area
            dataKey="healthy"
            fill="url(#trafficHealthy)"
            name="Healthy"
            stackId="traffic"
            stroke="#6f63ff"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="slow"
            fill="url(#trafficSlow)"
            name="Slow"
            stackId="traffic"
            stroke="#ffd166"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="errors"
            fill="url(#trafficErrors)"
            name="Errors"
            stackId="traffic"
            stroke="#ff5b73"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrafficTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const total = payload.reduce((sum, item) => sum + Number(item.value ?? 0), 0);

  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm shadow-2xl shadow-black/35">
      <p className="font-black text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted">{total} requests</p>
      <div className="mt-3 grid gap-1.5">
        {payload
          .filter((item) => Number(item.value ?? 0) > 0)
          .map((item) => (
            <div className="flex items-center justify-between gap-5" key={item.dataKey}>
              <span className="inline-flex items-center gap-2 text-muted">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-black text-foreground">{item.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function StatPill({
  label,
  meta,
  tone = "default",
  value
}: {
  label: string;
  meta?: React.ReactNode;
  tone?: "danger" | "default" | "warning";
  value: React.ReactNode;
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
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-sm font-black">{value}</p>
        {meta ? <p className="text-xs font-black opacity-75">{meta}</p> : null}
      </div>
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

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    compactDisplay: "short",
    notation: "compact"
  }).format(value);
}

function getDashboardHref(
  path: string,
  selectedProjectId: string,
  params: Record<string, string> = {}
) {
  const searchParams = new URLSearchParams(params);

  if (selectedProjectId !== "all") {
    searchParams.set("projectId", selectedProjectId);
  }

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}

function getTimeframeStart(timeframe: TimeframeValue) {
  const now = new Date();

  switch (timeframe) {
    case "12h":
      return new Date(now.getTime() - 12 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "24h":
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
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

function getTrafficBuckets(logs: VisibleLog[], timeframe: TimeframeValue) {
  if (!logs.length) {
    return [];
  }

  const config = getTrafficBucketConfig(timeframe);

  const counts = new Map<
    number,
    {
      errors: number;
      healthy: number;
      slow: number;
      total: number;
    }
  >();

  for (const log of logs) {
    const date = floorTrafficBucket(new Date(log.createdAt), config.unit);
    const key = date.getTime();
    const bucket = counts.get(key) ?? {
      errors: 0,
      healthy: 0,
      slow: 0,
      total: 0
    };

    bucket.total += 1;

    if (log.statusCode >= 400) {
      bucket.errors += 1;
    } else if (isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)) {
      bucket.slow += 1;
    } else {
      bucket.healthy += 1;
    }

    counts.set(key, bucket);
  }

  const latestBucket = floorTrafficBucket(new Date(), config.unit);
  const bucketKeys = Array.from({ length: config.count }, (_item, index) => {
    const offset = index - (config.count - 1);

    return addTrafficBucketOffset(latestBucket, config.unit, offset).getTime();
  });

  return bucketKeys.map((key) => {
    const bucket = counts.get(key) ?? {
      errors: 0,
      healthy: 0,
      slow: 0,
      total: 0
    };

    return {
      errors: bucket.errors,
      healthy: bucket.healthy,
      key,
      label: formatTrafficBucketLabel(key, config.unit),
      slow: bucket.slow,
      total: bucket.total
    };
  });
}

function getTrafficBucketConfig(timeframe: TimeframeValue): {
  count: number;
  unit: TrafficBucketUnit;
} {
  if (timeframe === "7d") {
    return { count: 7, unit: "day" };
  }

  if (timeframe === "30d") {
    return { count: 30, unit: "day" };
  }

  if (timeframe === "12h") {
    return { count: 12, unit: "hour" };
  }

  return { count: 24, unit: "hour" };
}

function floorTrafficBucket(date: Date, unit: TrafficBucketUnit) {
  const bucket = new Date(date);

  if (unit === "day") {
    bucket.setHours(0, 0, 0, 0);
  } else {
    bucket.setMinutes(0, 0, 0);
  }

  return bucket;
}

function addTrafficBucketOffset(date: Date, unit: TrafficBucketUnit, offset: number) {
  const bucket = new Date(date);

  if (unit === "day") {
    bucket.setDate(bucket.getDate() + offset);
  } else {
    bucket.setHours(bucket.getHours() + offset);
  }

  return bucket;
}

function formatTrafficBucketLabel(key: number, unit: TrafficBucketUnit) {
  const date = new Date(key);

  if (unit === "day") {
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short"
    });
  }

  return date.toLocaleTimeString([], {
    hour: "numeric"
  });
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

function statusMixDotClass(tone: DistributionItem["tone"]) {
  if (tone === "danger") {
    return "bg-red-300";
  }

  if (tone === "warning") {
    return "bg-yellow-200";
  }

  return "bg-primary-soft";
}

function statusMixSegmentClass(tone: DistributionItem["tone"]) {
  if (tone === "danger") {
    return "h-full bg-red-300";
  }

  if (tone === "warning") {
    return "h-full bg-yellow-200";
  }

  return "h-full bg-primary-soft";
}

function methodMixColor(index: number) {
  const colors = ["#8f5cff", "#56d6ff", "#ffd166", "#ff6b80", "#66e3b4", "#c7a6ff"];

  return colors[index % colors.length];
}
