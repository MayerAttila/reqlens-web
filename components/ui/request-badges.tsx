export const defaultLatencyErrorThresholdMs = 750;

export function isSlowRequest(
  durationMs: number,
  thresholdMs = defaultLatencyErrorThresholdMs
) {
  return durationMs >= thresholdMs;
}

export function StatusBadge({ statusCode }: { statusCode: number }) {
  const className =
    statusCode >= 500
      ? "bg-red-500/15 text-red-300"
      : statusCode >= 400
        ? "bg-yellow-500/15 text-yellow-200"
        : "bg-primary/15 text-primary-soft";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {statusCode}
    </span>
  );
}

export function LatencyBadge({
  durationMs,
  thresholdMs = defaultLatencyErrorThresholdMs
}: {
  durationMs: number;
  thresholdMs?: number;
}) {
  const slow = isSlowRequest(durationMs, thresholdMs);

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
        slow ? "bg-orange-500/15 text-orange-200" : "bg-surface text-foreground"
      }`}
      title={`${durationMs} ms`}
    >
      {durationMs} ms
    </span>
  );
}
