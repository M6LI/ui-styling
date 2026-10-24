import { Run, Metric, RFQ, RFQOutcome, Point } from "./domain";
/** Deterministic synthetic fixture, unrelated to real trading performance. */
let seed = 73;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const defs: [
  string,
  string,
  string,
  Metric["unit"],
  Metric["direction"],
  string,
][] = [
  [
    "pnl",
    "Total PnL",
    "Performance",
    "GBP",
    "higher",
    "Total strategy PnL in GBP; synthetic run-level example.",
  ],
  [
    "sharpe",
    "Sharpe ratio",
    "Performance",
    "ratio",
    "higher",
    "Annualised risk-adjusted return; backend must specify sampling convention.",
  ],
  [
    "drawdown",
    "Maximum drawdown",
    "Risk",
    "GBP",
    "lower",
    "Maximum drawdown expressed as a positive loss magnitude.",
  ],
  [
    "gross",
    "Gross position",
    "Risk",
    "GBP",
    "neutral",
    "Absolute long plus absolute short notional.",
  ],
  [
    "cr01",
    "Net CR01",
    "Risk",
    "GBP/bp",
    "neutral",
    "Signed credit spread sensitivity.",
  ],
  [
    "volume",
    "Traded volume",
    "Execution",
    "GBP",
    "neutral",
    "Total executed notional.",
  ],
  [
    "fillRate",
    "Fill rate",
    "Execution",
    "%",
    "neutral",
    "Filled RFQs divided by quoted RFQs, times 100.",
  ],
  [
    "capture",
    "Spread capture",
    "Execution",
    "bps",
    "higher",
    "Mean spread capture on executed RFQs; definition supplied by backend.",
  ],
  [
    "ic",
    "Forward correlation",
    "Signals",
    "ratio",
    "higher",
    "Pearson correlation to forward target on the specified universe and horizon.",
  ],
  [
    "loss",
    "Validation loss",
    "Training",
    "ratio",
    "lower",
    "Held-out validation loss.",
  ],
  [
    "turnover",
    "Turnover",
    "Execution",
    "ratio",
    "neutral",
    "Turnover with denominator specified by the application.",
  ],
  [
    "mae",
    "Prediction MAE",
    "Training",
    "bps",
    "lower",
    "Mean absolute prediction error, in basis points.",
  ],
];
export const metrics: Metric[] = defs.map(
  ([id, label, group, unit, direction, description]) => ({
    id,
    label,
    group,
    unit,
    direction,
    description,
    kind: "series",
    decimals: unit === "GBP" ? 0 : 2,
  }),
);
for (const horizon of [1, 2, 5, 10, 20, 60])
  for (const segment of [
    "All",
    "IG",
    "HY",
    "Buy",
    "Sell",
    "Liquid",
    "Illiquid",
    "Large",
  ])
    metrics.push({
      id: `ic.${horizon}.${segment}`,
      label: `IC · ${horizon}d · ${segment}`,
      group: "Signals",
      unit: "ratio",
      direction: "higher",
      description: `Synthetic ${horizon}-day forward Pearson correlation for ${segment} RFQs. Context is part of the metric identity.`,
      kind: "series",
      decimals: 3,
    });
export const groups = [...new Set(metrics.map((m) => m.group))];
const models = ["Heuristic", "Ridge", "XGBoost", "Ridge + interactions"];
export const runs: Run[] = Array.from({ length: 24 }, (_, i) => {
  const model = models[i % 4],
    pnl = 280000 + random() * 310000,
    base: Record<string, number | null> = {
      pnl,
      sharpe: 0.6 + random() * 1.4,
      drawdown: 20000 + random() * 65000,
      gross: 50e6 + random() * 130e6,
      cr01: -9000 + random() * 18000,
      volume: 200e6 + random() * 500e6,
      fillRate: 15 + random() * 25,
      capture: 0.4 + random() * 1.8,
      ic: 0.08 + random() * 0.17,
      loss: 0.15 + random() * 0.13,
      turnover: 2 + random() * 5,
      mae: 6 + random() * 4,
    };
  for (const metric of metrics)
    if (!(metric.id in base)) base[metric.id] = random() * 0.25 - 0.03;
  if (i === 7) base.ic = null;
  const series: Record<string, Point[]> = {};
  for (const metric of metrics) {
    const end = base[metric.id];
    series[metric.id] = Array.from({ length: 90 }, (_, t) => ({
      x: t,
      y:
        end === null || (t === 44 && i === 1)
          ? null
          : metric.id === "pnl"
            ? end * (t / 89) + Math.sin(t / 5 + i) * end * 0.035
            : metric.id === "loss"
              ? end + 0.7 * Math.exp(-t / 16) + (random() - 0.5) * 0.025
              : end * (0.9 + (0.1 * t) / 89) +
                (random() - 0.5) * Math.max(Math.abs(end) * 0.12, 0.02),
    }));
  }
  return {
    id: `BT-${String(2601 + i).padStart(4, "0")}`,
    name:
      i === 0
        ? "Baseline · NS 0.40"
        : `${model} · ${["60d rolling", "120d rolling", "expanding"][i % 3]}`,
    model,
    status: i === 22 ? "running" : i === 23 ? "failed" : "completed",
    createdAt: `2026-06-${String(28 - i).padStart(2, "0")}T09:30:00Z`,
    dataset: "Credit RFQs · H1 2026",
    seed: 40 + i,
    parameters: {
      horizon_days: [5, 10, 20][i % 3],
      lookback_days: [60, 120, 252][i % 3],
      alpha_scale: 0.4 + i * 0.02,
      risk_aversion: 0.8 + (i % 4) * 0.1,
      seed: 40 + i,
    },
    metrics: base,
    series,
  };
});
export const rfqs: RFQ[] = Array.from({ length: 180 }, (_, i) => ({
  id: `RFQ-${String(10001 + i)}`,
  timestamp: new Date(Date.UTC(2026, 5, 15, 8, 0, i * 47)).toISOString(),
  instrument: [
    "ACME 3.25 2031",
    "NORTH 4.50 2029",
    "ATLAS 5.10 2033",
    "CREST 2.75 2028",
    "MERIDIAN 4.00 2030",
  ][i % 5],
  sector: ["Financials", "Industrials", "Utilities"][i % 3],
  side: i % 2 ? "Sell" : "Buy",
  notional: [100000, 250000, 500000, 1000000][i % 4],
  currency: "GBP",
  tenor: 2 + (i % 9),
}));
export const outcomes: RFQOutcome[] = runs.slice(0, 8).flatMap((run, j) =>
  rfqs.flatMap((rfq, i) => {
    if (j > 0 && (i + j) % 13 === 0) return [];
    const decision = (i + j) % 7 === 0 ? "passed" : "quoted",
      filled = decision === "quoted" && (i % 5 < 2 || (i + j) % 11 === 0);
    return [
      {
        runId: run.id,
        rfqId: rfq.id,
        decision,
        filled,
        alphaBps: Math.sin(i * 0.7 + j) * 5,
        quoteBps: decision === "quoted" ? 85 + (i % 26) + j * 0.35 : null,
        pnlGBP: filled ? Math.round((random() - 0.35) * 4000) : null,
        markoutBps: filled && i % 17 !== 0 ? (random() - 0.4) * 8 : null,
        reason:
          decision === "passed"
            ? "Risk limit"
            : filled
              ? "Quote accepted"
              : "Quote not accepted",
      } as RFQOutcome,
    ];
  }),
);
