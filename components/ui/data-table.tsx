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
  storageKey?: string;
};

export function DataTable<TItem>({
  columns,
  emptyText,
  getRowKey,
  gridTemplateColumns,
  isLoading = false,
  items,
  loadingText = "Loading...",
  storageKey
}: DataTableProps<TItem>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    columnIndex: number;
    startX: number;
    startWidths: number[];
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);

  const activeGridTemplateColumns = columnWidths
    ? columnWidths.map((width) => `${width}px`).join(" ")
    : gridTemplateColumns;
  const tableWidth = columnWidths
    ? columnWidths.reduce((total, width) => total + width, 0)
    : undefined;

  const minWidths = useMemo(
    () => columns.map((column) => column.minWidth ?? 72),
    [columns]
  );

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const savedWidths = readSavedWidths(storageKey, columns.length);

    if (savedWidths) {
      setColumnWidths(savedWidths);
      return;
    }

    const initializeWidths = () => {
      const tableWidth = tableRef.current?.getBoundingClientRect().width ?? 0;
      setColumnWidths(
        parseInitialWidths(gridTemplateColumns, columns.length, tableWidth, minWidths)
      );
    };

    initializeWidths();
  }, [columns.length, gridTemplateColumns, minWidths, storageKey]);

  useEffect(() => {
    if (!storageKey || !columnWidths) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, storageKey]);

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
        tableRef.current?.getBoundingClientRect().width ?? 0,
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
    <div className="overflow-x-auto rounded-2xl bg-panel-strong" ref={tableRef}>
      <div style={tableWidth ? { minWidth: tableWidth } : undefined}>
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

        {items.map((item) => (
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
