# Comparison data contracts

The executable contracts and calculations live in `assets/template/src/domain.ts`. Values in `demo.ts` are deterministic synthetic fixtures. The backend remains responsible for valuation, transaction costs, horizons, currencies, trading calendars and the definition of financial metrics.

## Metrics and runs

Metric: stable ID, label, group, unit, improvement direction (`higher`, `lower`, `neutral`), description, scalar/series kind and decimals. Run: stable ID, name, model, status, created time, dataset, seed, parameter map, scalar metric map and time-series map. A series point has numeric X and numeric or null Y.

Percent values use the 0–100 convention. Basis points are already in basis points; do not multiply again. A scalar zero is valid. Missing, undefined and nonfinite values display a dash. Series nulls create gaps. Validate and normalise adapter data before it reaches the UI.

Absolute difference is candidate minus baseline. Relative difference is `100 × (candidate − baseline) / abs(baseline)`; zero baseline makes it unavailable. For percent-valued metrics, absolute differences must be labelled **pp**, not `%`. The template comparison table uses pp for these deltas. Unknown desirability must remain neutral.

## RFQ identity and record validity

One shared RFQ record per immutable RFQ ID; one outcome per `(runId, rfqId)`. `buildOutcomeIndex` rejects duplicate outcome pairs. Validate unique RFQ IDs, foreign keys, finite notionals and outcome consistency in the production adapter. The sample is GBP-only, full-notional fills only. Extend the schema for partial executions, multiple fills or currencies rather than treating them as equivalent.

An outcome has `decision: quoted | passed`, `filled: boolean`, nullable alpha/quote/PnL/markout, and a reason. Filled implies quoted. Missing outcome means no observation; passed is an explicit observation. A non-filled RFQ does not have a realised fill markout by default. Backend definitions may support other markout measures, which require different metric names and denominators.

For real data, also provide valuation timestamp, markout horizon, side convention, fees/cost basis and model/data versions. Do not join incompatible definitions. The sample explicitly labels these conventions as unspecified synthetic data.

## Populations

Apply shared RFQ filters (ID/instrument search, side, sector) first. From that eligible set:

| Population | Rule |
|---|---|
| Common | Outcome exists in every selected run |
| Union | Outcome exists in at least one selected run |
| Baseline | Outcome exists in the selected baseline |
| No selected runs | Empty population |

Then apply the optional `filled-any` cohort: retain RFQs filled in at least one selected run. This cohort is chosen once for the shared comparison, not independently per run. Each run's available data can still differ inside the shared population. Common presence does not imply common fills or common valid markouts.

## Summary formulas

For a chosen population of N unique RFQs and a run:

| Statistic | Definition |
|---|---|
| Observed | Number with an outcome for this run |
| Missing | N minus observed |
| Quoted | Observed records whose decision is quoted |
| Filled | Observed records with filled true |
| Fill rate | `100 × filled / quoted`; null if no quotes |
| Traded notional | Sum shared RFQ notional for filled records; sample assumes full fills |
| Observed-fill PnL | Sum finite PnLs on filled records; null if none; show valid count |
| Mean markout | Arithmetic mean of finite markouts on filled records; null if none; show valid count |
| Paired Δ markout | Mean(candidate markout − baseline markout) over RFQs filled in both with both values finite; show pair count |

The sample's fill rate is quote-conditioned, not fills divided by all eligible RFQs. The sample mean is equally weighted per fill, not notional weighted. A difference between two unpaired mean markouts is not the paired difference. No valid observations produces null, including for PnL; this avoids implying that unavailable outcomes amount to a zero result.

PnL with incomplete coverage is an observed sum, not an estimate of a complete total. Display its count and coverage. Zero traded notional can coexist with unavailable PnL. All summary tables must state the same active filters and population as individual inspection.

## Backend integration

Expose an adapter returning these contracts, with explicit loading/error states. Validate schema and data conventions. Preserve ID selection across refreshed results. Keep raw values separate from display formatting. For large data, calculate summaries on the server over the full filtered population rather than over one fetched page. Include query/population IDs in exports so results remain reproducible.

CSV exports escape fields and neutralise formula-like text. They are conveniences for the synthetic reference; extend them with selected run IDs, baseline, filter settings, units and calculation version for production auditability.
