---
name: ui-styling
description: Build and restyle local research web apps with a source-grounded Aim 3.29.1 interface. Use for experiment and backtest comparison, dense metric catalogues, model-training controls, signal analysis, RFQ inspection and RFQ summaries across backtest IDs. Includes an offline React/TypeScript UI kit, original fonts/icons/tokens, working templates, comparison semantics and local reference images. Use when consistent Aim styling is requested, including for agents without internet access.
---

# Aim research UI

Build from the supplied components and templates. Preserve their styling while connecting the user's data and extending the workflows.

## Start here

1. Read [fidelity and source boundaries](references/fidelity.md). Distinguish exact Aim assets/tokens from adapted components and custom screens. Do not promise a pixel-identical clone of every Aim page.
2. Read [design contract](references/design-contract.md) before changing styling.
3. Inspect [the working template](assets/template/src/main.tsx), [components](assets/template/src/ui.tsx) and [styles](assets/template/src/styles.css). These are the canonical implementation, not illustrative pseudocode.
4. View [metrics](assets/reference/metrics.png), [runs](assets/reference/runs.png), [RFQs](assets/reference/rfqs.png), [RFQ summaries](assets/reference/rfq-summary.png) and [components](assets/reference/gallery.png). If image viewing is unavailable, use the design contract's text values.
5. Read [application patterns](references/application-patterns.md) and, for comparisons, [data contracts](references/data-contracts.md).
6. Follow [offline development](references/offline-development.md). Make no internet requests, CDN imports or registry installs in the receiving environment.

## Run or copy the template

Prerequisites: Node.js 18+ with npm, Python 3.9+ and a modern browser already installed. Runtime installers are not bundled.

From this skill directory:

```bash
python scripts/bootstrap.py --target /path/to/new-research-app --serve
```

Use `py` or `python3` if that is the local Python command. On Windows use a Windows destination path. The script refuses a nonempty destination. It unpacks verified local dependency bytes, runs `npm ci --offline`, checks types, builds and tests. Open `http://127.0.0.1:4173`.

Inspect the included template in place with `python scripts/bootstrap.py --serve`.

After editing the generated app:

```bash
npm run typecheck
npm test
npm run build
npm run serve
```

The React 17 / Material UI 4 versions intentionally match Aim's frontend generation. Do not silently upgrade them or mix unrelated component libraries. For an existing application, inspect its framework and dependency versions and follow the integration choices in [offline development](references/offline-development.md). Do not overwrite existing package files.

## Visual rules

- Load bundled Inter for UI and Inconsolata for identifiers/code. Preserve the original font bytes and local IcoMoon map.
- Keep the original light workspace and dark indigo rail. The pinned SCSS is predominantly light; do not invent a dark theme and call it an exact Aim reproduction.
- Use source-derived tokens: actions `#1473e6`, text `#414b6d`, strong text `#1c2852`, secondary text `#83899e`, separators `#e8f1fc`. See [all tokens](assets/design-tokens.json).
- Preserve the 75px rail, 40px explorer bar, 32px default buttons and 28px table rows. Density modes are 22/28/32px. Root font size is 16px.
- Keep compact flat surfaces, thin separators and 4–6px radii. Avoid oversized cards, decorative gradients, marketing headings and unrelated icon sets.
- Reuse `AimProvider`, `Button`, `Input`, `Select`, `Badge`, `Tabs`, `DataTable`, `Panel`, `Modal`, `LineChart` and `Empty`. Read [component APIs](references/components.md).
- Assign stable run colours; use a dashed baseline in charts. Series colour is identity, not desirability.
- Keep units, horizons, populations, valid sample sizes and missingness visible.

## Extend to new pages

Compose the rail, explorer bar, query strip, content region and table/detail patterns. Put global run selection above page content, page filters above tables, and chart actions in chart headers.

Copy the nearest component for new controls and preserve its dimensions, typography, focus treatment, disabled states and keyboard behaviour. Add new variants to the gallery. Record custom extensions in [fidelity](references/fidelity.md).

Use [domain.ts](assets/template/src/domain.ts) as the UI boundary. Replace [demo.ts](assets/template/src/demo.ts) with a backend adapter. The fixture is deterministic synthetic data, not actual trading performance. Remove the sample-data badge only after live data is connected.

Use structured filters or validated backend queries. Never evaluate user input as code. Do not calculate finance metrics with guessed conventions.

## Many metrics

Give each metric a stable ID, group, unit, direction, context and description. Use searchable groups, pins, configurable columns and saved views. Page selected charts while preserving the full selection. Render missing values as gaps/dashes, not zero.

The template has 60 metrics and renders at most six charts per page. Tables paginate. For very large datasets add server pagination/aggregation or virtualisation behind the same visual components; the sample is not a production throughput claim.

## RFQ explorer

Use the linked RFQ table and detail panel. Navigate within the filtered and sorted population. Preserve selection by RFQ ID, not row number. Support previous/next controls and J/K or up/down outside input/dialog contexts.

Align by immutable `(runId, rfqId)`. Offer common / union / baseline populations. Distinguish missing, passed, quoted-not-filled and filled. Separate shared market information from run-dependent decisions. Show candidate-minus-baseline differences with units.

Use the summary functions for the supplied contracts. Distinguish quote-conditioned fill rates, observed-fill markout means and paired differences. Show sample counts and coverage. Never replace absent records or unavailable values with zero. Read [data contracts](references/data-contracts.md).

## Verify

- Build and test offline in a fresh destination with the bundled dependency archive.
- Run `python scripts/validate.py` in the skill directory after package changes.
- Exercise metric search/selection, baseline changes, density/columns, legends/zoom, RFQ navigation, filters/populations, summaries, exports and empty states.
- Check 1440×960 and 1920×1080; allow horizontal table scroll and stack RFQ panels at narrow widths.
- Check keyboard focus, tabs, modal close/focus restoration and long labels.
- Run [browser checks](scripts/browser-check.cjs) if Playwright and Chromium are installed. This optional test tooling is not bundled in the offline runtime. See [verification record](references/verification.md).
- Compare against local screenshots at the same viewport after fonts load. Template screenshot equality does not prove equality to the entire upstream application.

## Source access offline

Use [readable upstream evidence](references/upstream/), the [source manifest](references/upstream-manifest.json) and [font/glyph checksums](references/font-asset-manifest.json). Tag `v3.29.1` is pinned to commit `753f4b18437b8288e1c6f7c894c14a33cba9e7d0`.

For another component, extract the [frontend snapshot](assets/upstream/aim-3.29.1-frontend.tar.gz) locally and inspect `aim/web/ui/src`. This is reference source; the original full Aim application and all its dependencies are not installed by this kit. Use the standalone template for offline execution.

Keep [third-party notices](assets/licenses/THIRD-PARTY-NOTICES.md) and accompanying licenses with redistributed code/assets.
