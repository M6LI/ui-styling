# Design contract

## Layout

Use the full viewport. Fix the rail at 75px and let the main workspace fill the remainder with `min-width:0`. Body scrolling is disabled; content regions own scrolling. Use the template's 48px project bar, source-derived 40px explorer bar, compact query/selection strips and 24px desktop content insets.

| Element | Size / treatment |
|---|---|
| Rail | 75px; `#1d2253`; 80px items |
| Active rail marker | White; 3×40px; top 20px; right radius 6px |
| Explorer bar | 40px; 24px left padding; 12px uppercase title, .07em tracking |
| Metric catalogue | 246px; 215px below 1150px |
| Panel | 1px border; radius 6px; 54px template header |
| Chart grid | 16px gaps; 2 columns at 1440px; 3 above 1700px |
| RFQ split | `minmax(360px,1fr) minmax(440px,1.15fr)`; stacked below 1150px |
| Small windows | 12px inset; horizontally scrollable tables |

## Typography

Load the supplied variable Inter and Inconsolata files locally; wait for fonts before screenshots. Root size is 16px. Aim's named weights map 300→250, 400→350, 500→450, 600→550, 700→650; do not round them to conventional weights. Body uses 450, subdued chart labels 350, section/table headings 550. MUI controls retain upstream defaults unless explicitly overridden.

Size scale: 8, 10, 11, 12, 14, 16, 18, 24, 36px. BaseTable uses 13px. IDs/code use Inconsolata. Numbers use tabular figures, right alignment and consistent decimals. Compact context belongs in small labels, not large headings.

## Colours

| Role | Value |
|---|---|
| Action | `#1473e6` |
| Strong / body / secondary text | `#1c2852` / `#414b6d` / `#83899e` |
| Low emphasis | `#a4a9ba` |
| App separator / strong border | `#e8f1fc` / `#dee6f3` |
| Input border / focus border | `#bdcee8` / `#90afda` |
| Soft / selected surface | `#f8fafd` / `#e8f1fc` |
| Table header / grid / hover | `#f8f8f8` / `#eeeeee` / `#e2f2ff` |
| Upstream success / error | `#2bc784` / `#e64e48` |

The template deliberately uses darker semantic text `#168753` and `#cf3933` for small status/difference text. Always include textual meaning alongside colour. Exposure, volume and fill rate are neutral unless the application specifies desirability.

Exact series palette: `#3E72E7`, `#18AB6D`, `#7A4CE0`, `#E149A0`, `#E43D3D`, `#E8853D`, `#0394B4`, `#729B1B`. Assign from a persistent run-ID registry. The fixture uses stable run indices. More than eight runs need line-style differentiation or faceting; colour alone cannot distinguish every run.

## Controls

| Size | Height | Font | Horizontal padding | Radius |
|---|---:|---:|---:|---:|
| xxSmall | 20 | 10 | 8 | 4 |
| xSmall | 24 | 12 | 10 | 4 |
| small | 28 | 14 | 20 | 4 |
| medium | 32 | 14 | 20 | 6 |
| large | 36 | 14 | 20 | 8 |

Values come from Aim's Button.tsx. Icon-only controls are square at their size height with 4px padding. Disable ripple and shadows. Preserve keyboard focus outline and explicit hover/disabled states.

Standalone input adapter: 32px high, 4px radius, 14px body text / 12px dense filters. MUI Select supplies menus. Tabs use an underline and compact labels. Template chips are 18px high. Do not substitute oversized rounded pills.

## Tables

Rows: 22/28/32px, default 28. Headers: 28px. Toolbar/footer: 38px. Interior horizontal cell inset: 7.5px; outer edges: 15px. Freeze the identifying column, retain visible headers and scroll horizontally rather than shrinking text. Sort raw values, keep null/nonfinite values last, and display unavailable values as `—`. Use column selection for wide metric catalogues.

## Charts

White canvas, thin pale grids, 10px axis labels, 1.5px lines. Baseline dashes are a template extension. Show metric identity/unit/horizon, compact header controls and visible legend toggle state. Preserve missing-data gaps.

The supplied chart uses raw points, linear auto-ranging and a last-half zoom toggle. It does not smooth, resample, aggregate or interpolate. Any added transformation must be explicit. For intraday data use actual timestamps and a stated timezone; do not disguise row indices as dates.

## Accessibility and states

Label icon controls, use genuine disabled buttons, and show empty/error states and export feedback. Preserve dialog focus trapping/restoration. Do not apply RFQ keyboard navigation inside inputs, menus or dialogs. Support horizontal scrolling at browser zoom and respect reduced motion. This is primarily a desktop research interface.
