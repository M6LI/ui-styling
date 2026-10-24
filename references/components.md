# Components

Exported from `assets/template/src/ui.tsx`. Wrap once in `AimProvider`, import `styles.css` once and keep assets local. Inspect the `#gallery` route.

| Component | Inputs / behaviour |
|---|---|
| AimProvider | children; source-derived MUI light theme |
| Icon | name: IconName, size; exact local glyph, decorative |
| Button | MUI props plus size, icon, iconOnly; label icon-only buttons |
| Input | label plus native input props; optional leading icon |
| Select | label, value, onChange, options: {value,label}[] |
| Badge | children; tone: neutral/positive/negative/blue/warning |
| Tabs | label, value, onChange, items: {id,label,count?}[]; Arrow/Home/End keyboard behaviour |
| Panel | title, children; optional subtitle/actions |
| Empty | title, detail; optional action |
| Modal | open, onClose, title, children, optional actions; Escape/focus management |
| DataTable<T> | rows, columns, rowKey, label; optional selected/onRowClick/sort/onSort/pageSize/density |
| LineChart | metric, series; optional height/xLabel; missing gaps, legend toggles, simple zoom |

`Column<T>`: id, label, optional width/numeric/sticky, render(row). Use one sticky identity column. Sort externally on raw values; the table raises onSort(id) and shows supplied state. The table bounds DOM size by client pagination. For server data add controlled page/total/loading callbacks while keeping the same geometry.

`Series`: id, label, color, points: {x:number,y:number|null}[], baseline?. Supply increasing X and consistent X meanings across series. Keep colours stable by run ID. Metric supplies unit, precision and description. Chart calculations do not change the series; use a separate tested adapter for any data reduction.

Keep data fetching outside reusable components. For each extension define props, empty/error/disabled states and keyboard behaviour. Add a gallery example and record its source/adaptation in fidelity.md.
