# Application patterns

The template is a working starting point for local analysis. Its fixtures are synthetic. It does not execute training or backtests.

## Shared workspace

Keep one run selection and one baseline across views. Removing the baseline selects the first remaining run; no selected runs must produce an honest empty state. Run identity colours remain stable across navigation. The fixed rail carries top-level work areas; the explorer bar carries the page name and run picker. The selection strip shows comparison context before local filters.

Use readable experiment IDs with Inconsolata. Keep run parameters, dataset and status available in detail. Do not make a run's numerical result its only identity. Export raw data and units rather than formatted strings when further analysis is intended.

## Experiment table

Start with identity, model, status and a small useful set of metrics. Allow column selection and 22/28/32px density. Sort on underlying values, keeping missing values last. Preserve selected runs when filters change. Search is literal text, not executable code. Clicking an ID opens parameters and metadata; checkboxes control comparison selection.

For tens of thousands of runs, replace client filtering and pagination with a server query. Preserve these controls and table styles. Show result count, loading, failure and retry states. Cancel stale requests when filters change.

## Metric-heavy comparison

Use the left catalogue for searchable groups, pins and selected metrics. The main region shows scalar comparisons and paginated charts. The fixture has 60 metrics; adding metrics should enlarge the catalogue, not create 60 simultaneously mounted charts. Selected charts page in batches of six.

Metric identity includes its definition and context: for example `ic_10d_credit` differs from `ic_1d_credit`. Human labels may be concise but tooltips/detail must expose unit, horizon, aggregation and sample population. Store these fields in the real backend's metric schema. The compact fixture encodes horizon/segment in IDs and descriptions.

Default to a useful selection; let users pin metrics and save a named view. The current sample saves one local view and pins under versioned localStorage keys. A production multi-view system should persist selected IDs, groups, filters, run selection, baseline and chart settings with a schema version. Validate saved IDs against the current catalogue.

Use scalar deltas with explicit directionality. A loss decrease is favourable; a turnover increase is not inherently favourable. Percent-valued differences are percentage points. Show raw values even when delta colouring is enabled.

Keep chart headers compact, legends visible and run colours stable. The baseline has a dashed line. The reference renderer supports linear series, nearest-point hover, legend toggles and a simple half-domain zoom; it is not a full analytical charting engine. Extend via explicit controls for log scale, aligned X, smoothing or confidence intervals only when their semantics are specified. Do not silently smooth or interpolate missing values.

## RFQ inspection

Use a filter strip followed by two tabs: individual RFQs and summaries. Both tabs use the same eligible RFQ set, presence population and execution cohort. Individual view has a paginated identity table on the left and shared metadata plus per-run outcomes on the right. At narrow widths the panels stack.

Previous/next and J/K or up/down move through the filtered population. Ignore shortcuts while typing or when a modal is open. Preserve selection by RFQ ID; if a filter removes that ID, select the first remaining RFQ and update the position label. Selection changes reveal the appropriate table page.

Shared attributes: immutable RFQ ID, UTC timestamp, instrument, side, notional, currency, tenor. Per-run values: presence, decision, execution, alpha, quote, markout, PnL and reason. A missing run/RFQ record is a separate state from a deliberate pass or an unfilled quote. Align columns by immutable ID, never by array position or timestamp alone.

Summaries state their population and denominator. Compare observed/missing counts, quotes, fills, fill rate, traded notional, observed-fill PnL, valid markout count and paired baseline difference. Keep coverage visible even when users select a common population. See data-contracts.md for exact definitions.

## Training and new analysis pages

The training template exports a validated configuration and shows sample diagnostics. Connect execution through an explicit backend adapter with queued/running/completed/failed/cancelled states, provenance and persisted run IDs. Do not turn a UI timeout into a claimed successful training run.

For another analysis view, reuse the workspace, filters, panels, table and chart components. Examples include feature drift, signal decay, parameter sweeps and calibration. Build its data adapter before inventing charts. Keep the selected experiment context shared, define units and missingness, and add a gallery example for any genuinely new component.

## Error and empty states

Use concise text beside the affected region: no selected runs, no matching metrics, no RFQs in this population, no observations for this run, or backend error. Keep filters and context visible so users can recover. An empty dataset is not a loading state. Loading is not zero performance. Use inline retry for failed requests and retain the last valid context without presenting stale data as fresh.
