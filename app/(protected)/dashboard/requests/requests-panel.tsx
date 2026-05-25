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
  isSlowRequest,
  LatencyBadge,
  StatusBadge
} from "../../../../components/ui/request-badges";
import { SearchInput } from "../../../../components/ui/search-input";

type RequestLog = {
  createdAt: string;
  durationMs: number;
  errorMessage: string | null;
  id: string;
  latencyErrorThresholdMs: number;
  method: string;
  path: string;
  projectId: string;
  projectName: string;
  statusCode: number;
};

type Project = {
  id: string;
  name: string;
};

type LogsResponse = {
  logs: RequestLog[];
  nextCursor: string | null;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const pageSizeOptions = [50, 100, 250];

const requestColumns: Array<DataTableColumn<RequestLog>> = [
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
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requestSearch, setRequestSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam ?? "all"
  );

  const successfulRequests = logs.filter((log) => log.statusCode < 400).length;
  const problemRequests = logs.length - successfulRequests;
  const slowRequests = logs.filter((log) =>
    isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
  ).length;
  const averageLatency = logs.length
    ? Math.round(
        logs.reduce((total, log) => total + log.durationMs, 0) / logs.length
      )
    : 0;

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(requestSearch);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [requestSearch]);

  useEffect(() => {
    setSelectedProjectId(projectIdParam ?? "all");
  }, [projectIdParam]);

  useEffect(() => {
    resetPagination();
  }, [selectedProjectId, debouncedSearch, pageSize]);

  useEffect(() => {
    void loadLogs(cursorStack[pageIndex] ?? null);
  }, [cursorStack, pageIndex, selectedProjectId, debouncedSearch, pageSize]);

  async function loadProjects() {
    try {
      const response = await fetch(`${apiUrl}/projects`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load projects.");
      }

      const data = (await response.json()) as { projects: Project[] };
      setProjects(data.projects);
    } catch {
      toast.error("Could not load projects.");
    }
  }

  async function loadLogs(cursor: string | null) {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        limit: String(pageSize)
      });

      if (cursor) {
        params.set("cursor", cursor);
      }

      if (selectedProjectId !== "all") {
        params.set("projectId", selectedProjectId);
      }

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      const response = await fetch(`${apiUrl}/logs/entries?${params.toString()}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Could not load logs.");
      }

      const data = (await response.json()) as LogsResponse;
      setLogs(data.logs);
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Could not load logs.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetPagination() {
    setCursorStack([null]);
    setPageIndex(0);
  }

  function goNext() {
    if (!nextCursor) {
      return;
    }

    setCursorStack((current) => [...current.slice(0, pageIndex + 1), nextCursor]);
    setPageIndex((current) => current + 1);
  }

  function goPrevious() {
    setPageIndex((current) => Math.max(0, current - 1));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Requests" value={logs.length} />
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
                  label: project.name,
                  value: project.id
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
          items={logs}
          loadingText="Loading requests..."
          showPagination={false}
          storageKey="reqlens:requests-table-widths"
        />
        <ServerPagination
          canGoNext={Boolean(nextCursor)}
          canGoPrevious={pageIndex > 0}
          endCount={logs.length}
          onNext={goNext}
          onPageSizeChange={setPageSize}
          onPrevious={goPrevious}
          page={pageIndex + 1}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
        />
      </section>
    </div>
  );
}

function ServerPagination({
  canGoNext,
  canGoPrevious,
  endCount,
  onNext,
  onPageSizeChange,
  onPrevious,
  page,
  pageSize,
  pageSizeOptions
}: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  endCount: number;
  onNext: () => void;
  onPageSizeChange: (pageSize: number) => void;
  onPrevious: () => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
}) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-panel-strong px-4 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows</span>
          <div className="w-24">
            <DropdownSelect
              onChange={(value) => onPageSizeChange(Number(value))}
              options={pageSizeOptions.map((option) => ({
                label: String(option),
                value: String(option)
              }))}
              size="sm"
              value={String(pageSize)}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="h-9 rounded-xl bg-surface px-3 text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          type="button"
        >
          Prev
        </button>
        <span className="min-w-16 text-center">Page {page}</span>
        <button
          className="h-9 rounded-xl bg-surface px-3 text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canGoNext}
          onClick={onNext}
          type="button"
        >
          Next
        </button>
      </div>
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

  return <div className="rounded-3xl bg-panel p-5">{content}</div>;
}
