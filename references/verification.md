# Verification record

Validated on 2026-10-24 on Linux, Node.js 24.22.1, npm 11.9 and Python 3.12. The declared runtime minimum is Node.js 18 / Python 3.9; Windows, macOS and older Node versions were not executed here.

## Completed checks

- Bootstrapped a fresh destination from the distributed dependency archive. All 45 package instances installed with `npm ci --offline --ignore-scripts --no-audit --no-fund`. TypeScript, WASM build and domain tests passed.
- Twelve domain tests cover common/union/baseline RFQ populations, missing coverage, denominators, paired markouts, no-valid-data results, shared fill cohorts, duplicate pairs, zero/negative/missing baselines, desirability, null-last sorting, filters, CSV escaping and numeric formatting.
- Browser checks passed under Chromium 138.0.7204.0. Captures use 1440×960, 1920×1080 and 900×800 viewports, device scale 1, en-GB locale and loaded local fonts.
- Exercised metric search and empty results, metric selection and saved-view restoration, series legend toggles, chart zoom/reset, baseline change, run picker and modal focus return, table density, metric columns, CSV export, RFQ previous/next and keyboard navigation, population selection, summary table, tab keyboard navigation, training validation and JSON export.
- Browser routes blocked external HTTP(S). There were zero attempted external requests and zero uncaught page errors. See `assets/reference/browser-check.json`.
- Checked 75px rail and 40px explorer bar geometry and 22px compact table rows. Reviewed reference screenshots for the metric view, RFQ details/summary, narrow layout and component gallery.
- Skill frontmatter validator, relative reference validation, pinned source hashes and local-asset checks passed.
- A fresh agent used only this skill and local runtimes to build an additional signal-horizon diagnostics view in an isolated app. The extension reused shared run/baseline context, searchable metrics, charts, deltas, counts, definitions and CSV export. Its typecheck, offline build, 19 tests and browser checks passed with no external requests or page errors. The validation exposed a writable-cache assumption; bootstrap now keeps its cache inside the generated destination, and that revised clean offline path was executed successfully.
- All ten original font/glyph files were compared byte-for-byte with the pinned upstream checkout. Their SHA-256 values are retained in font-asset-manifest.json.

## Reproduce

```bash
python scripts/bootstrap.py --target /path/to/empty/check-app
python scripts/validate.py
```

With an already-installed Playwright and Chromium:

```bash
node scripts/browser-check.cjs
```

The browser script starts and stops a local server. Optional environment variables: `UI_APP_DIR` for a built copied app, `UI_TEST_PORT` (default 4175), `CHROMIUM_EXECUTABLE` for an existing browser executable. The script updates reference images, so run it only when intending to regenerate those artifacts. Playwright and browser binaries are optional development tools and are not part of the offline dependency archive.

## Limits

These checks establish a working offline template and specific comparison behaviours. They are not a cross-browser accessibility audit, production performance test, security certification, or proof of pixel equality with the entire upstream Aim application. The template uses synthetic data and no live training/backtest server. Screen composition and custom SVG charts are adaptations; exact provenance boundaries are in fidelity.md.
