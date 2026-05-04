"use client";

import { PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type DataTableColumn<TItem> = {
  className?: string;
  header: string;
  minWidth?: number;
  render: (item: TItem) => ReactNode;
};

type DataTableProps<TItem> = {
  columns: Array<DataTableColumn<TItem>>;
  emptyText: string;
  getRowKey: (item: TItem) => string;
  gridTemplateColumns: string;
  isLoading?: boolean;
  items: TItem[];
  loadingText?: string;
  pageSizeOptions?: number[];
  storageKey?: string;
};

const defaultPageSizeOptions = [20, 50, 100];

export function DataTable<TItem>({
  columns,
  emptyText,
  getRowKey,
  gridTemplateColumns,
  isLoading = false,
  items,
  loadingText = "Loading...",
  pageSizeOptions = defaultPageSizeOptions,
  storageKey
}: DataTableProps<TItem>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    columnIndex: number;
    startX: number;
    startWidths: number[];
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);

  const activeGridTemplateColumns = columnWidths
    ? columnWidths.map((width) => `${width}px`).join(" ")
    : gridTemplateColumns;

  const minWidths = useMemo(
    () => columns.map((column) => column.minWidth ?? 72),
    [columns]
  );
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  const pageStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, items.length);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const savedWidths = readSavedWidths(storageKey, columns.length);

    const availableWidth = getAvailableTableWidth(tableRef.current, columns.length);

    if (savedWidths) {
      setColumnWidths(clampWidths(savedWidths, minWidths, availableWidth));
      return;
    }

    const initializeWidths = () => {
      setColumnWidths(
        parseInitialWidths(
          gridTemplateColumns,
          columns.length,
          getAvailableTableWidth(tableRef.current, columns.length),
          minWidths
        )
      );
    };

    initializeWidths();
  }, [columns.length, gridTemplateColumns, minWidths, storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const savedPageSize = readSavedPageSize(storageKey, pageSizeOptions);

    if (savedPageSize) {
      setPageSize((current) => (current === savedPageSize ? current : savedPageSize));
    }
  }, [pageSizeOptions, storageKey]);

  useEffect(() => {
    if (!storageKey || !columnWidths) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(`${storageKey}:page-size`, String(pageSize));
  }, [pageSize, storageKey]);

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    function handlePointerMove(event: globalThis.PointerEvent) {
      const activeDrag = dragState.current;

      if (!activeDrag) {
        return;
      }

      const delta = event.clientX - activeDrag.startX;
      setColumnWidths((currentWidths) => {
        const widths = [...(currentWidths ?? activeDrag.startWidths)];
        const nextColumnIndex = activeDrag.columnIndex + 1;
        const currentMinWidth = minWidths[activeDrag.columnIndex];
        const nextMinWidth = minWidths[nextColumnIndex];
        const currentStartWidth = activeDrag.startWidths[activeDrag.columnIndex];
        const nextStartWidth = activeDrag.startWidths[nextColumnIndex];
        const safeDelta = Math.min(
          Math.max(delta, currentMinWidth - currentStartWidth),
          nextStartWidth - nextMinWidth
        );

        widths[activeDrag.columnIndex] = currentStartWidth + safeDelta;
        widths[nextColumnIndex] = nextStartWidth - safeDelta;
        return widths;
      });
    }

    function handlePointerUp() {
      dragState.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [minWidths]);

  function startColumnResize(
    event: PointerEvent<HTMLButtonElement>,
    columnIndex: number
  ) {
    if (!storageKey) {
      return;
    }

    const widths =
      columnWidths ??
      parseInitialWidths(
        gridTemplateColumns,
        columns.length,
        getAvailableTableWidth(tableRef.current, columns.length),
        minWidths
      );

    event.preventDefault();
    dragState.current = {
      columnIndex,
      startX: event.clientX,
      startWidths: widths
    };
    setColumnWidths(widths);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-panel-strong" ref={tableRef}>
      <div>
        <div
          className="grid gap-3 border-b border-background px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted"
          style={{ gridTemplateColumns: activeGridTemplateColumns }}
        >
          {columns.map((column, index) => (
            <div
              className={`relative min-w-0 pr-2 ${column.className ?? ""}`}
              key={column.header}
            >
              <span className="block truncate">{column.header}</span>
              {storageKey && index < columns.length - 1 ? (
                <button
                  aria-label={`Resize ${column.header} column`}
                  className="absolute -right-2 top-1/2 h-7 w-3 -translate-y-1/2 cursor-col-resize rounded-full transition hover:bg-primary/35"
                  onPointerDown={(event) => startColumnResize(event, index)}
                  type="button"
                >
                  <span className="mx-auto block h-5 w-px bg-line" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {isLoading ? <p className="p-4 text-sm text-muted">{loadingText}</p> : null}

        {!isLoading && items.length === 0 ? (
          <p className="p-4 text-sm text-muted">{emptyText}</p>
        ) : null}

        {visibleItems.map((item) => (
          <div
            className="grid gap-3 border-b border-background/70 px-4 py-3 text-sm text-foreground last:border-b-0"
            key={getRowKey(item)}
            style={{ gridTemplateColumns: activeGridTemplateColumns }}
          >
            {columns.map((column) => (
              <div className={`min-w-0 ${column.className ?? ""}`} key={column.header}>
                {column.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
      {!isLoading && items.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-background px-4 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <select
              className="h-9 rounded-xl bg-surface px-2 text-sm text-foreground outline-none ring-1 ring-line transition focus:ring-primary/60"
              onChange={(event) => setPageSize(Number(event.target.value))}
              value={pageSize}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {pageStart}-{pageEnd} of {items.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="h-9 rounded-xl bg-surface px-3 text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Prev
              </button>
              <span className="min-w-16 text-center">
                {page} / {totalPages}
              </span>
              <button
                className="h-9 rounded-xl bg-surface px-3 text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readSavedWidths(storageKey: string, columnCount: number): number[] | null {
  try {
    const savedValue = window.localStorage.getItem(storageKey);

    if (!savedValue) {
      return null;
    }

    const parsedValue = JSON.parse(savedValue);

    if (
      !Array.isArray(parsedValue) ||
      parsedValue.length !== columnCount ||
      parsedValue.some((width) => typeof width !== "number" || Number.isNaN(width))
    ) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function readSavedPageSize(
  storageKey: string,
  pageSizeOptions: number[]
): number | null {
  const savedValue = window.localStorage.getItem(`${storageKey}:page-size`);

  if (!savedValue) {
    return null;
  }

  const parsedValue = Number(savedValue);
  return pageSizeOptions.includes(parsedValue) ? parsedValue : null;
}

function getAvailableTableWidth(element: HTMLDivElement | null, columnCount: number) {
  const tableWidth = element?.getBoundingClientRect().width ?? 0;
  const horizontalPadding = 32;
  const totalGridGap = Math.max(0, columnCount - 1) * 12;

  return Math.max(0, tableWidth - horizontalPadding - totalGridGap);
}

function clampWidths(widths: number[], minWidths: number[], availableWidth: number) {
  const minTotal = minWidths.reduce((total, width) => total + width, 0);
  const currentTotal = widths.reduce((total, width) => total + width, 0);

  if (availableWidth <= 0 || currentTotal <= availableWidth) {
    return widths.map((width, index) => Math.max(minWidths[index], width));
  }

  if (availableWidth <= minTotal) {
    return minWidths;
  }

  const extraWidth = availableWidth - minTotal;
  const currentExtraWidth = widths.reduce(
    (total, width, index) => total + Math.max(0, width - minWidths[index]),
    0
  );

  return widths.map((width, index) => {
    const extra = Math.max(0, width - minWidths[index]);
    const scaledExtra = currentExtraWidth > 0 ? (extra / currentExtraWidth) * extraWidth : 0;
    return minWidths[index] + scaledExtra;
  });
}

function parseInitialWidths(
  gridTemplateColumns: string,
  columnCount: number,
  tableWidth: number,
  minWidths: number[]
) {
  const parts = gridTemplateColumns.split(/\s+/).filter(Boolean);

  if (parts.length !== columnCount || tableWidth <= 0) {
    return minWidths.map((width) => Math.max(width, 120));
  }

  const fixedTotal = parts.reduce((total, part) => {
    if (part.endsWith("px")) {
      return total + Number(part.replace("px", ""));
    }

    return total;
  }, 0);
  const fractionTotal = parts.reduce((total, part) => {
    if (part.endsWith("fr")) {
      return total + Number(part.replace("fr", ""));
    }

    return total;
  }, 0);
  const availableWidth = Math.max(tableWidth - fixedTotal, 0);

  return parts.map((part, index) => {
    if (part.endsWith("px")) {
      return Math.max(minWidths[index], Number(part.replace("px", "")));
    }

    if (part.endsWith("fr") && fractionTotal > 0) {
      const fraction = Number(part.replace("fr", ""));
      return Math.max(minWidths[index], (availableWidth * fraction) / fractionTotal);
    }

    return Math.max(minWidths[index], 120);
  });
}
