/** UI-facing contracts and pure comparison functions. No backend assumptions. */
export type Unit = "GBP" | "bps" | "%" | "ratio" | "count" | "GBP/bp";
export type Direction = "higher" | "lower" | "neutral";
export type Metric = {
  id: string;
  label: string;
  group: string;
  unit: Unit;
  direction: Direction;
  description: string;
  kind: "scalar" | "series";
  decimals: number;
};
export type Point = { x: number; y: number | null };
export type Run = {
  id: string;
  name: string;
  model: string;
  status: "completed" | "running" | "failed";
  createdAt: string;
  dataset: string;
  seed: number;
  parameters: Record<string, string | number>;
  metrics: Record<string, number | null>;
  series: Record<string, Point[]>;
};
export type RFQ = {
  id: string;
  timestamp: string;
  instrument: string;
  sector: string;
  side: "Buy" | "Sell";
  notional: number;
  currency: "GBP";
  tenor: number;
};
export type RFQOutcome = {
  rfqId: string;
  runId: string;
  decision: "quoted" | "passed";
  filled: boolean;
  alphaBps: number | null;
  quoteBps: number | null;
  pnlGBP: number | null;
  markoutBps: number | null;
  reason: string;
};
export type Population = "common" | "union" | "baseline";
export type Cohort = "all" | "filled-any";
export type RFQFilter = {
  query: string;
  side: "All" | "Buy" | "Sell";
  sector: string;
};
export type Sort = { key: string; direction: "asc" | "desc" };
export const PALETTE = [
  "#3E72E7",
  "#18AB6D",
  "#7A4CE0",
  "#E149A0",
  "#E43D3D",
  "#E8853D",
  "#0394B4",
  "#729B1B",
];
export const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
export function formatNumber(
  value: number | null | undefined,
  unit: Unit = "ratio",
  decimals = 2,
): string {
  if (!isFiniteNumber(value)) return "—";
  const prefix = unit === "GBP" ? "£" : "";
  const suffix =
    unit === "bps"
      ? " bp"
      : unit === "%"
        ? "%"
        : unit === "GBP/bp"
          ? " £/bp"
          : "";
  return (
    prefix +
    value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix
  );
}
/** Relative delta uses |baseline|. Percentage metrics remain percentage-point deltas. */
export function delta(
  value: number | null | undefined,
  baseline: number | null | undefined,
) {
  if (!isFiniteNumber(value) || !isFiniteNumber(baseline))
    return { absolute: null, relative: null };
  return {
    absolute: value - baseline,
    relative:
      baseline === 0 ? null : (100 * (value - baseline)) / Math.abs(baseline),
  };
}
export function deltaTone(value: number | null, direction: Direction) {
  if (value === null || value === 0 || direction === "neutral")
    return "neutral";
  return (direction === "higher" ? value > 0 : value < 0)
    ? "positive"
    : "negative";
}
export function buildOutcomeIndex(outcomes: RFQOutcome[]) {
  const index = new Map<string, Map<string, RFQOutcome>>();
  for (const o of outcomes) {
    if (!index.has(o.runId)) index.set(o.runId, new Map());
    const map = index.get(o.runId)!;
    if (map.has(o.rfqId))
      throw new Error(`Duplicate RFQ outcome: ${o.runId}/${o.rfqId}`);
    map.set(o.rfqId, o);
  }
  return index;
}
export type OutcomeIndex = ReturnType<typeof buildOutcomeIndex>;
export function filterRFQs(rfqs: RFQ[], filter: RFQFilter) {
  const q = filter.query.trim().toLowerCase();
  return rfqs.filter(
    (r) =>
      (!q ||
        [r.id, r.instrument, r.sector].some((s) =>
          s.toLowerCase().includes(q),
        )) &&
      (filter.side === "All" || r.side === filter.side) &&
      (filter.sector === "All" || r.sector === filter.sector),
  );
}
export function selectPopulation(
  rfqs: RFQ[],
  index: OutcomeIndex,
  runIds: string[],
  baseline: string,
  population: Population,
  cohort: Cohort = "all",
) {
  if (!runIds.length) return [];
  return rfqs.filter((r) => {
    const present = runIds.map((id) => index.get(id)?.has(r.id) ?? false);
    const included =
      population === "common"
        ? present.every(Boolean)
        : population === "baseline"
          ? (index.get(baseline)?.has(r.id) ?? false)
          : present.some(Boolean);
    return (
      included &&
      (cohort === "all" ||
        runIds.some((id) => index.get(id)?.get(r.id)?.filled))
    );
  });
}
export function summariseRFQs(
  population: RFQ[],
  index: OutcomeIndex,
  runId: string,
) {
  const observations = population
    .map((r) => ({ rfq: r, outcome: index.get(runId)?.get(r.id) }))
    .filter((v): v is { rfq: RFQ; outcome: RFQOutcome } => !!v.outcome);
  const quoted = observations.filter((v) => v.outcome.decision === "quoted");
  const fills = observations.filter((v) => v.outcome.filled);
  const pnl = fills.map((v) => v.outcome.pnlGBP).filter(isFiniteNumber);
  const markouts = fills
    .map((v) => v.outcome.markoutBps)
    .filter(isFiniteNumber);
  return {
    population: population.length,
    observed: observations.length,
    missing: population.length - observations.length,
    quoted: quoted.length,
    fills: fills.length,
    fillRate: quoted.length ? (100 * fills.length) / quoted.length : null,
    pnlGBP: pnl.length ? pnl.reduce((a, b) => a + b, 0) : null,
    pnlCount: pnl.length,
    meanMarkoutBps: markouts.length
      ? markouts.reduce((a, b) => a + b, 0) / markouts.length
      : null,
    markoutCount: markouts.length,
    tradedNotional: fills.reduce((a, v) => a + v.rfq.notional, 0),
  };
}
/** Compare paired outcomes; missing markouts never become zero. */
export function pairedMarkoutDifference(
  population: RFQ[],
  index: OutcomeIndex,
  candidate: string,
  baseline: string,
) {
  const values = population.flatMap((r) => {
    const c = index.get(candidate)?.get(r.id),
      b = index.get(baseline)?.get(r.id);
    return c?.filled &&
      b?.filled &&
      isFiniteNumber(c.markoutBps) &&
      isFiniteNumber(b.markoutBps)
      ? [c.markoutBps - b.markoutBps]
      : [];
  });
  return {
    n: values.length,
    mean: values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null,
  };
}
/** Null/non-finite values sort last in either direction, with a stable tie breaker. */
export function sortRows<T>(
  rows: T[],
  value: (row: T) => string | number | null | undefined,
  direction: "asc" | "desc",
) {
  return rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      const x = value(a.row),
        y = value(b.row),
        xm = x == null || (typeof x === "number" && !Number.isFinite(x)),
        ym = y == null || (typeof y === "number" && !Number.isFinite(y));
      if (xm || ym) return xm === ym ? a.i - b.i : xm ? 1 : -1;
      const result =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      return (direction === "asc" ? result : -result) || a.i - b.i;
    })
    .map((v) => v.row);
}
export function toCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const escape = (v: string | number | null | undefined) => {
    let s = v == null ? "" : String(v);
    // Protect text cells from spreadsheet formula interpretation; preserve numeric negatives.
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const blob = new Blob(["\uFEFF" + toCSV(headers, rows)], {
      type: "text/csv;charset=utf-8",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
