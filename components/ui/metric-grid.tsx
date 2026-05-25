import { ReactNode } from "react";
import Link from "next/link";

export type MetricBlock = {
  helperText?: string;
  href?: string;
  label: string;
  linkLabel?: string;
  tone?: "danger" | "default";
  value: ReactNode;
};

type MetricGridProps = {
  blocks: MetricBlock[];
  columns?: 2 | 3 | 4;
};

const columnClass: Record<NonNullable<MetricGridProps["columns"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4"
};

export function MetricGrid({ blocks, columns = 4 }: MetricGridProps) {
  return (
    <section className={`grid gap-4 ${columnClass[columns]}`}>
      {blocks.map((block) => (
        <MetricCard block={block} key={block.label} />
      ))}
    </section>
  );
}

function MetricCard({ block }: { block: MetricBlock }) {
  const content = (
    <>
      <p className="text-sm text-muted">{block.label}</p>
      <p
        className={`mt-3 text-4xl font-black ${
          block.tone === "danger" ? "text-red-300" : "text-foreground"
        }`}
      >
        {block.value}
      </p>
      {block.helperText ? (
        <p className="mt-2 text-xs text-muted">{block.helperText}</p>
      ) : null}
      {block.href && block.linkLabel ? (
        <p className="mt-4 text-xs font-black text-muted">
          {block.linkLabel} →
        </p>
      ) : null}
    </>
  );

  if (block.href) {
    return (
      <Link
        className="rounded-3xl bg-panel p-5 transition hover:-translate-y-0.5 hover:bg-surface"
        href={block.href}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-3xl bg-panel p-5">
      {content}
    </article>
  );
}
