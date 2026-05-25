"use client";

import { PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { DropdownSelect } from "./dropdown-select";

export type DataTableColumn<TItem> = {
  className?: string;
  header: string;
  minWidth?: number;
  render: (item: TItem, state: { isExpanded: boolean }) => ReactNode;
};

type DataTableProps<TItem> = {
  columns: Array<DataTableColumn<TItem>>;
  emptyText: string;
  expandedRow?: (item: TItem) => ReactNode;
  getRowKey: (item: TItem) => string;
  gridTemplateColumns: string;
  isLoading?: boolean;
  items: TItem[];
  loadingText?: string;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  storageKey?: string;
};

const defaultPageSizeOptions = [20, 50, 100];

export function DataTable<TItem>({
  columns,
  emptyText,
  expandedRow,
  getRowKey,
  gridTemplateColumns,
  isLoading = false,
  items,
  loadingText = "Loading...",
  pageSizeOptions = defaultPageSizeOptions,
  showPagination = true,
  storageKey
}: DataTableProps<TItem>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    columnIndex: number;
    startX: number;
    startWidths: number[];
  } | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [preferredColumnWidths, setPreferredColumnWidths] = useState<number[] | null>(
    null
  );
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);

  const minWidths = useMemo(
    () => columns.map((column) => column.minWidth ?? 72),
    [columns]
  );
  const displayColumnWidths = useMemo(
    () =>
      preferredColumnWidths
        ? clampWidths(preferredColumnWidths, minWidths, availableWidth)
        : null,
    [availableWidth, minWidths, preferredColumnWidths]
  );
  const activeGridTemplateColumns = displayColumnWidths
    ? displayColumnWidths.map((width) => `${width}px`).join(" ")
    : gridTemplateColumns;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = showPagination
    ? items.slice((page - 1) * pageSize, page * pageSize)
    : items;
  const pageStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, items.length);

  useEffect(() => {
    if (!storageKey || !showPagination) {
      return;
    }

    const savedWidths = readSavedWidths(storageKey, columns.length);

    if (savedWidths) {
      setPreferredColumnWidths(savedWidths);
      return;
    }

    const initializeWidths = () => {
      setPreferredColumnWidths(
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
  }, [pageSizeOptions, showPagination, storageKey]);

  useEffect(() => {
    if (!storageKey || !preferredColumnWidths) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(preferredColumnWidths));
  }, [preferredColumnWidths, storageKey]);

  useEffect(() => {
    if (!storageKey || typeof ResizeObserver === "undefined") {
      return;
    }

    const table = tableRef.current;

    if (!table) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setAvailableWidth(getAvailableTableWidth(table, columns.length));
    });

    setAvailableWidth(getAvailableTableWidth(table, columns.length));
    observer.observe(table);

    return () => observer.disconnect();
  }, [columns.length, storageKey]);

  useEffect(() => {
    if (!storageKey || !showPagination) {
      return;
    }

    window.localStorage.setItem(`${storageKey}:page-size`, String(pageSize));
  }, [pageSize, showPagination, storageKey]);

  useEffect(() => {
    if (showPagination) {
      setPage(1);
    }
  }, [items, pageSize, showPagination]);

  useEffect(() => {
    if (showPagination) {
      setPage((current) => Math.min(current, totalPages));
    }
  }, [showPagination, totalPages]);

  useEffect(() => {
    function handlePointerMove(event: globalThis.PointerEvent) {
      const activeDrag = dragState.current;

      if (!activeDrag) {
        return;
      }

      const delta = event.clientX - activeDrag.startX;
      setPreferredColumnWidths((currentWidths) => {
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
      displayColumnWidths ??
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
    setPreferredColumnWidths(widths);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div className="relative min-w-0 rounded-2xl bg-panel-strong" ref={tableRef}>
      <div className="overflow-x-auto">
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

        {visibleItems.map((item) => {
          const rowKey = getRowKey(item);
          const isExpanded = expandedRowKey === rowKey;

          return (
            <div className="border-b border-background/70 last:border-b-0" key={rowKey}>
              <button
                className={`grid w-full gap-3 px-4 py-3 text-left text-sm text-foreground transition ${
                  expandedRow ? "hover:bg-surface/40" : ""
                } ${isExpanded ? "bg-surface/30" : ""}`}
                onClick={() => {
                  if (!expandedRow) {
                    return;
                  }

                  setExpandedRowKey((current) =>
                    current === rowKey ? null : rowKey
                  );
                }}
                style={{ gridTemplateColumns: activeGridTemplateColumns }}
                type="button"
              >
                {columns.map((column) => (
                  <div
                    className={`min-w-0 ${column.className ?? ""}`}
                    key={column.header}
                  >
                    {column.render(item, { isExpanded })}
                  </div>
                ))}
              </button>
              {expandedRow ? (
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="px-4 pb-4">
                      {isExpanded ? expandedRow(item) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {showPagination && !isLoading && items.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-background px-4 py-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <div className="w-24">
              <DropdownSelect
                onChange={(value) => setPageSize(Number(value))}
                options={pageSizeOptions.map((option) => ({
                  label: String(option),
                  value: String(option)
                }))}
                value={String(pageSize)}
              />
            </div>
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
    const safeWidths = widths.map((width, index) => Math.max(minWidths[index], width));
    const safeTotal = safeWidths.reduce((total, width) => total + width, 0);

    if (availableWidth <= 0 || safeTotal >= availableWidth) {
      return safeWidths;
    }

    const extraWidth = availableWidth - safeTotal;
    const expandableIndexes = safeWidths
      .map((width, index) => ({ index, width }))
      .filter(({ width }, index) => widths[index] > minWidths[index])
      .map(({ index }) => index);
    const indexes = expandableIndexes.length
      ? expandableIndexes
      : safeWidths.map((_width, index) => index);
    const extraPerColumn = extraWidth / indexes.length;

    return safeWidths.map((width, index) =>
      indexes.includes(index) ? width + extraPerColumn : width
    );
  }

  if (availableWidth <= minTotal) {
    const scale = availableWidth / minTotal;
    return minWidths.map((width) => Math.max(36, width * scale));
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
