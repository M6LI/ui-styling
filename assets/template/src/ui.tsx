import React, { useEffect, useRef, useState } from "react";
import {
  Button as MuiButton,
  ButtonProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select as MuiSelect,
  ThemeProvider,
  StylesProvider,
  unstable_createMuiStrictModeTheme as createMuiTheme,
} from "@material-ui/core";
import icons from "./icons.json";
import { Metric, Point, formatNumber } from "./domain";
/** Aim Theme.tsx light theme, unchanged values; typography keeps upstream MUI defaults. */
const theme = createMuiTheme({
  typography: { fontFamily: "Inter, sans-serif" },
  overrides: {
    MuiDivider: { root: { backgroundColor: "#E8F1FC" } },
    MuiButton: {
      root: { height: 32, boxShadow: "unset" },
      contained: { boxShadow: "unset" },
    },
  },
  props: { MuiButtonBase: { disableRipple: true } },
  palette: {
    type: "light",
    primary: { main: "#1473E6" },
    secondary: { main: "#1c2852" },
    text: { primary: "#414B6D" },
  },
  spacing: (n: number) => `${n}em`,
});
export function AimProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <StylesProvider injectFirst>{children}</StylesProvider>
    </ThemeProvider>
  );
}
export type IconName = keyof typeof icons;
export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <span aria-hidden="true" className="aim-icon" style={{ fontSize: size }}>
      {icons[name]}
    </span>
  );
}
type Size = "xxSmall" | "xSmall" | "small" | "medium" | "large";
const sizing: Record<
  Size,
  {
    height: number;
    fontSize: number;
    padding: string;
    borderRadius: number;
    minWidth: number | string;
  }
> = {
  xxSmall: {
    height: 20,
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 4,
    minWidth: "auto",
  },
  xSmall: {
    height: 24,
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 4,
    minWidth: "auto",
  },
  small: {
    height: 28,
    fontSize: 14,
    padding: "8px 20px",
    borderRadius: 4,
    minWidth: 70,
  },
  medium: {
    height: 32,
    fontSize: 14,
    padding: "8px 20px",
    borderRadius: 6,
    minWidth: 70,
  },
  large: {
    height: 36,
    fontSize: 14,
    padding: "8px 20px",
    borderRadius: 8,
    minWidth: 70,
  },
};
/** Adapted Aim kit/Button; removes its app-specific error boundary only. */
export function Button({
  size = "medium",
  icon,
  iconOnly,
  children,
  ...props
}: Omit<ButtonProps, "size"> & {
  size?: Size;
  icon?: IconName;
  iconOnly?: boolean;
}) {
  const sz = sizing[size];
  return (
    <MuiButton
      {...props}
      color={props.color || "primary"}
      style={{
        ...sz,
        ...(iconOnly ? { width: sz.height, minWidth: 20, padding: 4 } : {}),
        ...props.style,
      }}
    >
      {icon && (
        <span className={children ? "button-icon" : ""}>
          <Icon name={icon} />
        </span>
      )}
      {children}
    </MuiButton>
  );
}
export function Input({
  label,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: IconName;
}) {
  return (
    <label className={"aim-input " + (icon ? "with-icon" : "")}>
      <span className="sr-only">{label}</span>
      {icon && <Icon name={icon} />}
      <input {...props} aria-label={label} />
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <MuiSelect
      className="aim-select"
      variant="outlined"
      value={value}
      onChange={(e) => onChange(String(e.target.value))}
      inputProps={{ "aria-label": label }}
    >
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </MuiSelect>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "blue" | "warning";
}) {
  return <span className={`aim-badge ${tone}`}>{children}</span>;
}
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { id: T; label: string; count?: number }[];
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div role="tablist" aria-label={label} className="aim-tabs" ref={ref}>
      {items.map((item, i) => (
        <button
          role="tab"
          key={item.id}
          aria-selected={value === item.id}
          tabIndex={value === item.id ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={(e) => {
            let next = i;
            if (e.key === "ArrowRight") next = (i + 1) % items.length;
            else if (e.key === "ArrowLeft")
              next = (i - 1 + items.length) % items.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = items.length - 1;
            else return;
            e.preventDefault();
            onChange(items[next].id);
            (ref.current?.children[next] as HTMLElement)?.focus();
          }}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="tab-count">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="modal-title"
    >
      <DialogTitle id="modal-title">
        <span className="modal-title">{title}</span>
        <Button
          iconOnly
          icon="close"
          aria-label="Close dialog"
          onClick={onClose}
        />
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}
export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty" role="status">
      <Icon name="search-info" size={28} />
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="row">{actions}</div>
      </header>
      {children}
    </section>
  );
}
export type Column<T> = {
  id: string;
  label: string;
  width?: number;
  numeric?: boolean;
  sticky?: boolean;
  render: (row: T) => React.ReactNode;
};
/** Bounded pagination for huge populations; use server pagination/virtualisation in production. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selected,
  onRowClick,
  sort,
  onSort,
  label,
  pageSize = 25,
  density = 28,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selected?: string;
  onRowClick?: (row: T) => void;
  sort?: { key: string; direction: "asc" | "desc" };
  onSort?: (id: string) => void;
  label: string;
  pageSize?: number;
  density?: 22 | 28 | 32;
}) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1),
    safePage = Math.min(page, maxPage);
  useEffect(() => {
    setPage(0);
  }, [rows.length]);
  useEffect(() => {
    if (selected) {
      const idx = rows.findIndex((r) => rowKey(r) === selected);
      if (idx >= 0) setPage(Math.floor(idx / pageSize));
    }
  }, [selected]);
  return (
    <div className="table-frame">
      <div className="table-scroll">
        <table
          className="aim-table"
          aria-label={label}
          style={{ "--row-height": `${density}px` } as React.CSSProperties}
        >
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`${c.numeric ? "numeric" : ""} ${c.sticky ? "sticky" : ""}`}
                  style={{ minWidth: c.width || 110 }}
                  aria-sort={
                    sort?.key === c.id
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {onSort ? (
                    <button onClick={() => onSort(c.id)}>
                      {c.label}
                      {sort?.key === c.id && (
                        <Icon
                          name={
                            sort.direction === "asc"
                              ? "sort-arrow-up"
                              : "sort-arrow-down"
                          }
                          size={12}
                        />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .slice(safePage * pageSize, (safePage + 1) * pageSize)
              .map((row) => (
                <tr
                  key={rowKey(row)}
                  className={selected === rowKey(row) ? "selected" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={`${c.numeric ? "numeric" : ""} ${c.sticky ? "sticky" : ""}`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {!rows.length && (
          <Empty
            title="No results"
            detail="Try changing the filters or the comparison population."
          />
        )}
      </div>
      <footer className="table-footer">
        <span>
          {rows.length
            ? `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, rows.length)}`
            : "0"}{" "}
          of {rows.length.toLocaleString()} rows
        </span>
        <div className="row">
          <Button
            size="xSmall"
            iconOnly
            icon="arrow-left"
            aria-label="Previous table page"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          />
          <span>
            Page {safePage + 1} / {maxPage + 1}
          </span>
          <Button
            size="xSmall"
            iconOnly
            icon="arrow-right"
            aria-label="Next table page"
            disabled={safePage >= maxPage}
            onClick={() => setPage(safePage + 1)}
          />
        </div>
      </footer>
    </div>
  );
}
export type Series = {
  id: string;
  label: string;
  color: string;
  points: Point[];
  baseline?: boolean;
};
/** Standalone SVG adaptation of Aim line styling. Missing points form real gaps. */
export function LineChart({
  metric,
  series,
  height = 210,
  xLabel = "Trading day",
}: {
  metric: Metric;
  series: Series[];
  height?: number;
  xLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null),
    [zoom, setZoom] = useState(false),
    [hidden, setHidden] = useState<string[]>([]);
  const W = 640,
    H = height,
    L = 62,
    R = 18,
    T = 14,
    B = 35;
  const visible = series.filter((s) => !hidden.includes(s.id));
  const xs = visible.flatMap((s) => s.points.map((p) => p.x)),
    xMin = xs.length ? Math.min(...xs) : 0,
    xMax = xs.length ? Math.max(...xs) : 1,
    start = zoom ? xMin + (xMax - xMin) * 0.5 : xMin;
  const ys = visible.flatMap((s) =>
    s.points
      .filter((p) => p.x >= start && p.y !== null && Number.isFinite(p.y))
      .map((p) => p.y as number),
  );
  const y0 = ys.length ? Math.min(...ys) : 0,
    y1 = ys.length ? Math.max(...ys) : 1,
    pad = (y1 - y0 || Math.max(Math.abs(y1) * 0.1, 1)) * 0.12,
    min = y0 - pad,
    max = y1 + pad;
  const sx = (x: number) =>
      L + ((x - start) / Math.max(xMax - start, 1)) * (W - L - R),
    sy = (y: number) => T + ((max - y) / (max - min)) * (H - T - B);
  const path = (points: Point[]) => {
    let pen = false;
    return points
      .map((p) => {
        if (p.x < start || p.y === null || !Number.isFinite(p.y)) {
          pen = false;
          return "";
        }
        const seg = `${pen ? "L" : "M"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`;
        pen = true;
        return seg;
      })
      .join(" ");
  };
  const compact = (n: number) =>
    Math.abs(n) >= 1e6
      ? `${(n / 1e6).toFixed(1)}m`
      : Math.abs(n) >= 1e3
        ? `${(n / 1e3).toFixed(0)}k`
        : n.toFixed(metric.decimals);
  return (
    <div className="chart">
      <div className="chart-heading">
        <span className="mono" title={metric.description}>
          {metric.id}
        </span>
        <span className="muted">{metric.unit}</span>
        <span className="spacer" />
        <Button
          size="xxSmall"
          iconOnly
          icon={zoom ? "zoom-out" : "zoom-in"}
          aria-label={`${zoom ? "Reset zoom" : "Zoom"} ${metric.label}`}
          onClick={() => setZoom(!zoom)}
        />
      </div>
      {!ys.length ? (
        <Empty
          title="No observations"
          detail="Select runs with this metric, or enable a series."
        />
      ) : (
        <div className="chart-canvas">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`${metric.label} by ${xLabel}`}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(
                Math.max(
                  start,
                  Math.min(
                    xMax,
                    start +
                      ((((e.clientX - r.left) / r.width) * W - L) /
                        (W - L - R)) *
                        (xMax - start),
                  ),
                ),
              );
            }}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = min + ((max - min) * i) / 4;
              return (
                <g key={i}>
                  <line
                    x1={L}
                    x2={W - R}
                    y1={sy(y)}
                    y2={sy(y)}
                    stroke="#E8F1FC"
                  />
                  <text x={L - 8} y={sy(y) + 3} textAnchor="end">
                    {compact(y)}
                  </text>
                </g>
              );
            })}
            {Array.from({ length: 5 }, (_, i) => {
              const x = start + ((xMax - start) * i) / 4;
              return (
                <text key={i} x={sx(x)} y={H - 15} textAnchor="middle">
                  {Math.round(x)}
                </text>
              );
            })}
            {visible.map((s) => (
              <path
                key={s.id}
                d={path(s.points)}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.baseline ? "5 3" : undefined}
              />
            ))}
            {hover !== null && (
              <line
                x1={sx(hover)}
                x2={sx(hover)}
                y1={T}
                y2={H - B}
                stroke="#A4A9BA"
                strokeDasharray="3 3"
              />
            )}
          </svg>
          {hover !== null && (
            <div className="chart-tooltip">
              <strong>
                {xLabel} {Math.round(hover)}
              </strong>
              {visible.map((s) => {
                const p = s.points.reduce<Point | undefined>(
                  (a, b) =>
                    !a || Math.abs(b.x - hover) < Math.abs(a.x - hover) ? b : a,
                  undefined,
                );
                return (
                  <div key={s.id}>
                    <span className="dot" style={{ background: s.color }} />
                    {s.label}
                    <b>{formatNumber(p?.y, metric.unit, metric.decimals)}</b>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div className="chart-legend">
        {series.map((s) => (
          <button
            key={s.id}
            aria-pressed={!hidden.includes(s.id)}
            className={hidden.includes(s.id) ? "muted" : ""}
            onClick={() =>
              setHidden(
                hidden.includes(s.id)
                  ? hidden.filter((id) => id !== s.id)
                  : [...hidden, s.id],
              )
            }
          >
            <span
              className="legend-line"
              style={{
                borderColor: s.color,
                borderTopStyle: s.baseline ? "dashed" : "solid",
              }}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
