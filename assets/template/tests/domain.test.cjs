const { test } = require("node:test");
const assert = require("node:assert/strict");
const d = require("../.test-build/domain.cjs");
const rfqs = ["a", "b", "c", "d"].map((id) => ({
  id,
  notional: 100,
  currency: "GBP",
  timestamp: "2026-01-01T00:00:00Z",
  instrument: "X",
  side: "Buy",
  sector: "IG",
  tenor: 5,
}));
const o = (rfqId, runId, filled, markoutBps, extra = {}) => ({
  rfqId,
  runId,
  filled,
  markoutBps,
  decision: "quoted",
  pnlGBP: filled ? 20 : null,
  alphaBps: 1,
  quoteBps: 100,
  reason: "fixture",
  ...extra,
});
const idx = d.buildOutcomeIndex([
  o("a", "base", true, 2),
  o("b", "base", false, null, { decision: "passed" }),
  o("c", "base", true, null),
  o("a", "candidate", true, 5),
  o("b", "candidate", true, 4),
  o("d", "candidate", false, null),
]);
test("RFQ populations distinguish common, union, and baseline and empty selection", () => {
  assert.deepEqual(
    d
      .selectPopulation(rfqs, idx, ["base", "candidate"], "base", "common")
      .map((r) => r.id),
    ["a", "b"],
  );
  assert.equal(
    d.selectPopulation(rfqs, idx, ["base", "candidate"], "base", "union")
      .length,
    4,
  );
  assert.deepEqual(
    d
      .selectPopulation(rfqs, idx, ["base", "candidate"], "base", "baseline")
      .map((r) => r.id),
    ["a", "b", "c"],
  );
  assert.equal(d.selectPopulation(rfqs, idx, [], "base", "union").length, 0);
  assert.equal(
    d.selectPopulation(rfqs, idx, ["base", "absent"], "base", "common").length,
    0,
  );
});
test("union summary retains missing and uses correct quote and markout denominators", () => {
  const s = d.summariseRFQs(rfqs, idx, "base");
  assert.equal(s.observed, 3);
  assert.equal(s.missing, 1);
  assert.equal(s.quoted, 2);
  assert.equal(s.fills, 2);
  assert.equal(s.fillRate, 100);
  assert.equal(s.meanMarkoutBps, 2);
  assert.equal(s.markoutCount, 1);
  assert.equal(s.pnlGBP, 40);
  assert.equal(s.pnlCount, 2);
  assert.equal(s.tradedNotional, 200);
});
test("paired markout requires both fills and both values", () =>
  assert.deepEqual(d.pairedMarkoutDifference(rfqs, idx, "candidate", "base"), {
    n: 1,
    mean: 3,
  }));
test("untraded and missing are not zero markout; no valid observations means null", () => {
  const s = d.summariseRFQs(rfqs, idx, "absent");
  assert.equal(s.meanMarkoutBps, null);
  assert.equal(s.pnlGBP, null);
  assert.equal(s.fillRate, null);
  assert.equal(s.missing, 4);
});
test("filled-any cohort is applied once to the shared RFQ population", () =>
  assert.deepEqual(
    d
      .selectPopulation(
        rfqs,
        idx,
        ["base", "candidate"],
        "base",
        "union",
        "filled-any",
      )
      .map((r) => r.id),
    ["a", "b", "c"],
  ));
test("duplicate RFQ/run pairs are rejected", () =>
  assert.throws(
    () => d.buildOutcomeIndex([o("a", "x", true, 1), o("a", "x", true, 2)]),
    /Duplicate/,
  ));
test("delta handles zero, negative baseline, null and nonfinite", () => {
  assert.deepEqual(d.delta(3, 0), { absolute: 3, relative: null });
  assert.deepEqual(d.delta(-5, -10), { absolute: 5, relative: 50 });
  assert.deepEqual(d.delta(null, 2), { absolute: null, relative: null });
  assert.equal(d.delta(Infinity, 1).absolute, null);
});
test("metric desirability is explicit", () => {
  assert.equal(d.deltaTone(1, "neutral"), "neutral");
  assert.equal(d.deltaTone(-1, "lower"), "positive");
  assert.equal(d.deltaTone(-1, "higher"), "negative");
});
test("stable numeric sorting leaves missing values last in either direction", () => {
  assert.deepEqual(d.sortRows([2, null, NaN, 1], x => x, "asc"), [1, 2, null, NaN]);
  assert.deepEqual(d.sortRows([2, null, NaN, 1], x => x, "desc"), [2, 1, null, NaN]);
  assert.deepEqual(
    d.sortRows([null, 2, 1], (x) => x, "desc"),
    [2, 1, null],
  );
});
test("filter matches identifiers, instrument, side and sector", () => {
  assert.equal(
    d.filterRFQs(rfqs, { query: "a", side: "Buy", sector: "IG" }).length,
    1,
  );
  assert.equal(
    d.filterRFQs(rfqs, { query: "", side: "Sell", sector: "All" }).length,
    0,
  );
});
test("CSV preserves quotes and commas and protects formula text", () => {
  const csv = d.toCSV(
    ["name", "value"],
    [
      ["=SUM(A1)", 'a,"b"'],
      [-2, null],
    ],
  );
  assert.match(csv, /'=SUM/);
  assert.match(csv, /"a,""b"""/);
  assert.match(csv, /"-2",""/);
});
test("formatting preserves zero and never emits NaN", () => {
  assert.equal(d.formatNumber(0, "bps", 2), "0.00 bp");
  assert.equal(d.formatNumber(NaN), "—");
});
