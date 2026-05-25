"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";
import { CopyIconButton } from "../../../../components/ui/copy-icon-button";
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

type LogDetail = {
  id: string;
  requestBody: unknown;
  responseBody: unknown;
};

type LogsResponse = {
  logs: RequestLog[];
  nextCursor: string | null;
};

type ProblemTypeFilter = "all" | "errors" | "latency";

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";
const pageSizeOptions = [50, 100, 250];

export function ErrorsPanel() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const typeParam = searchParams.get("type");
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [errorSearch, setErrorSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(250);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam ?? "all"
  );
  const [selectedProblemType, setSelectedProblemType] =
    useState<ProblemTypeFilter>(normalizeProblemType(typeParam));

  const totalProblems = logs.length;
  const slowCalls = logs.filter((log) =>
    isSlowRequest(log.durationMs, log.latencyErrorThresholdMs)
  ).length;
  const serverErrors = logs.filter((log) => log.statusCode >= 500).length;
  const nonServerErrors = logs.filter(
    (log) => log.statusCode >= 400 && log.statusCode < 500
  ).length;

  const errorColumns: Array<DataTableColumn<RequestLog>> = [
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
      className: "flex justify-end",
      header: "",
      render: (_log, { isExpanded }) => (
        <span className="grid size-8 place-items-center rounded-xl bg-surface text-muted">
          <FiChevronDown
            className={`size-4 transition ${isExpanded ? "rotate-180" : ""}`}
          />
        </span>
      )
    }
  ];

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(errorSearch);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [errorSearch]);

  useEffect(() => {
    setSelectedProjectId(projectIdParam ?? "all");
  }, [projectIdParam]);

  useEffect(() => {
    setSelectedProblemType(normalizeProblemType(typeParam));
  }, [typeParam]);

  useEffect(() => {
    resetPagination();
  }, [selectedProjectId, selectedProblemType, debouncedSearch, pageSize]);

  useEffect(() => {
    void loadLogs(cursorStack[pageIndex] ?? null);
  }, [
    cursorStack,
    pageIndex,
    selectedProjectId,
    selectedProblemType,
    debouncedSearch,
    pageSize
  ]);

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
        limit: String(pageSize),
        problemType: selectedProblemType
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
        throw new Error("Could not load problems.");
      }

      const data = (await response.json()) as LogsResponse;
      setLogs(data.logs);
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Could not load problems.");
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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          href="/dashboard/errors"
          label="Problem calls"
          linkLabel="View all"
          value={totalProblems}
        />
        <SummaryCard
          href="/dashboard/errors?type=latency"
          label="Latency alerts"
          linkLabel="View slow calls"
          value={slowCalls}
          tone="warning"
        />
        <SummaryCard
          href="/dashboard/errors?type=errors"
          label="Client errors"
          linkLabel="View 4xx"
          value={nonServerErrors}
        />
        <SummaryCard
          href="/dashboard/errors?type=errors"
          label="Server errors"
          linkLabel="View 5xx"
          value={serverErrors}
          tone="danger"
        />
      </section>

      <section className="min-w-0 rounded-3xl bg-panel p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem] lg:max-w-3xl">
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
            <DropdownSelect
              onChange={setSelectedProblemType}
              options={[
                { label: "All problems", value: "all" },
                { label: "Errors", value: "errors" },
                { label: "Latency alerts", value: "latency" }
              ]}
              value={selectedProblemType}
            />
            <DropdownSelect
              onChange={(value) => setPageSize(Number(value))}
              options={pageSizeOptions.map((option) => ({
                label: String(option),
                value: String(option)
              }))}
              value={String(pageSize)}
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
          expandedRow={(log) => <LogDetailsRow logId={log.id} />}
          getRowKey={(log) => log.id}
          gridTemplateColumns="0.9fr 0.7fr 1.4fr 0.7fr 0.7fr 1fr 48px"
          isLoading={isLoading}
          items={logs}
          loadingText="Loading problems..."
          showPagination={false}
          storageKey="reqlens:errors-table-widths"
        />
        <ServerPagination
          canGoNext={Boolean(nextCursor)}
          canGoPrevious={pageIndex > 0}
          endCount={logs.length}
          onNext={goNext}
          onPrevious={goPrevious}
          page={pageIndex + 1}
          pageSize={pageSize}
        />
      </section>
    </div>
  );
}

function LogDetailsRow({ logId }: { logId: string }) {
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const response = await fetch(`${apiUrl}/logs/${logId}`, {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Could not load log detail.");
        }

        const data = (await response.json()) as { log: LogDetail };
        setDetail(data.log);
      } catch {
        toast.error("Could not load log detail.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [logId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-background/50 p-4 text-sm text-muted">
        Loading payloads...
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background/50 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <PayloadPanel label="Request body" value={detail?.requestBody} />
        <PayloadPanel label="Response body" value={detail?.responseBody} />
      </div>
    </div>
  );
}

function PayloadPanel({ label, value }: { label: string; value: unknown }) {
  const formattedPayload = formatPayload(value);

  async function copyPayload() {
    await navigator.clipboard.writeText(formattedPayload);
    toast.success(`${label} copied.`);
  }

  return (
    <div className="rounded-2xl bg-panel-strong p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="relative mt-3">
        <CopyIconButton
          className="absolute right-3 top-3"
          label={`Copy ${label}`}
          onCopy={copyPayload}
        />
        <pre className="max-h-96 overflow-auto rounded-2xl bg-background p-4 pr-16 text-xs leading-6 text-foreground">
          {formattedPayload}
        </pre>
      </div>
    </div>
  );
}

function ServerPagination({
  canGoNext,
  canGoPrevious,
  endCount,
  onNext,
  onPrevious,
  page,
  pageSize
}: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  endCount: number;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  pageSize: number;
}) {
  const start = endCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + endCount;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-panel-strong px-4 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <span>
        {start}-{end}
      </span>
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

function formatPayload(value: unknown) {
  if (value === null || value === undefined) {
    return "No payload captured.";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function normalizeProblemType(type: string | null): ProblemTypeFilter {
  if (type === "errors" || type === "latency") {
    return type;
  }

  return "all";
}

function SummaryCard({
  href,
  label,
  linkLabel,
  tone = "default",
  value
}: {
  href?: string;
  label: string;
  linkLabel?: string;
  tone?: "danger" | "default" | "warning";
  value: number;
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
