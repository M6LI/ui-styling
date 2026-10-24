# Fidelity and scope

Reference: Aim 3.29.1, tag `v3.29.1`, commit `753f4b18437b8288e1c6f7c894c14a33cba9e7d0`. The tag was released in May 2025; it is a fixed reference, not a claim about the latest release.

| Element | Classification | Evidence |
|---|---|---|
| Inter/Inconsolata TTF and IcoMoon glyph assets | Original copied bytes | `aim/web/ui/public/assets` |
| Colours, weight values, size scale | Exact extracted values | `src/styles/abstracts/_variables.scss` |
| Eight-colour series palette | Exact values | `src/config/colors/colors.ts` |
| Row densities 22/28/32 | Exact values | `src/config/table/tableConfigs.ts` |
| Rail and explorer-bar dimensions | Source-derived geometry | `SideBar/Sidebar.scss`, `AppBar/AppBar.scss` |
| Theme and button size map | Adapted upstream implementation | `Theme/Theme.tsx`, `kit/Button` |
| Tables, inputs, tabs, badges, empty states | Standalone adaptations | Source values plus `ui.tsx` / `styles.css` |
| SVG charts | Custom renderer with Aim styling | Source palette and line widths; not Aim's D3 code |
| Metric catalogue, saved views and selection flow | Research template | `main.tsx` |
| RFQ detail, summaries, training form | Custom domain extensions | `main.tsx` and `domain.ts` |
| Local screenshots | Template regression references | Captured from this package |

This package carries authentic source/assets and source-derived styling. It does not claim that every template is pixel-identical to stock Aim or that all Aim features are ported. Advanced chart grouping/aggregation, Monaco query editing, drag layouts, all original screens and Aim's server API are not implemented. The full frontend snapshot is included for further local inspection.

Material UI 4.12.4 is within Aim's `^4.12.2` range; React is 17.0.2. Changing UI-library generation may alter geometry. Fonts and theme do not guarantee pixel equality across browsers/operating systems.

Intentional extensions: neutral research mark, 48px project bar, RFQ/training navigation, chart pagination, responsive RFQ stacking, accessible modal focus management, bespoke table/inputs/tabs. Badge text size and some semantic text colours are adapted for this template. Record additional adaptations here.

Upstream's dark Theme.tsx branch is partial and many SCSS surfaces hard-code white. This package uses the original light workspace and indigo rail. A full dark variant needs its own specification and visual validation.

Never modify `references/upstream` or silently replace the source archive. Verify evidence against `upstream-manifest.json`. Put application changes in the template and update its screenshots when appearance intentionally changes.
