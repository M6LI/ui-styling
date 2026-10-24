import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  AimProvider,
  Badge,
  Button,
  Column,
  DataTable,
  Empty,
  Icon,
  IconName,
  Input,
  LineChart,
  Modal,
  Panel,
  Select,
  Tabs,
} from "./ui";
import {
  Cohort,
  Metric,
  Population,
  RFQ,
  Run,
  Sort,
  buildOutcomeIndex,
  delta,
  deltaTone,
  downloadCSV,
  filterRFQs,
  formatNumber,
  pairedMarkoutDifference,
  PALETTE,
  selectPopulation,
  sortRows,
  summariseRFQs,
} from "./domain";
import { groups, metrics, outcomes, rfqs, runs } from "./demo";
import "./styles.css";
type Page = "runs" | "metrics" | "rfqs" | "training" | "gallery";
const index = buildOutcomeIndex(outcomes),
  metricMap = new Map(metrics.map((m) => [m.id, m]));
const colour = (id: string) =>
  PALETTE[
    Math.max(
      0,
      runs.findIndex((r) => r.id === id),
    ) % PALETTE.length
  ];
const initials = ["BT-2601", "BT-2602", "BT-2603"];
function usePersisted<T>(
  key: string,
  fallback: T,
  validate: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return validate(v) ? v : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage may be disabled; session still works. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
function App() {
  const [page, setPage] = useState<Page>(() => {
    const p = location.hash.slice(1);
    return ["runs", "metrics", "rfqs", "training", "gallery"].includes(p)
      ? (p as Page)
      : "metrics";
  });
  const [selected, setSelected] = useState(initials),
    [baseline, setBaseline] = useState(initials[0]),
    [picker, setPicker] = useState(false),
    [pickerQuery, setPickerQuery] = useState("");
  const [notice, setNotice] = useState("");
  const selectedRuns = runs.filter((r) => selected.includes(r.id));
  useEffect(() => {
    const onHash = () => {
      const p = location.hash.slice(1);
      if (["runs", "metrics", "rfqs", "training", "gallery"].includes(p))
        setPage(p as Page);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    location.hash = page;
  }, [page]);
  useEffect(() => {
    if (!selected.includes(baseline)) setBaseline(selected[0] || "");
  }, [selected, baseline]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const nav: { id: Page; label: string; icon: IconName }[] = [
    { id: "runs", label: "Runs", icon: "runs" },
    { id: "metrics", label: "Metrics", icon: "metrics" },
    { id: "rfqs", label: "RFQs", icon: "compare" },
    { id: "training", label: "Training", icon: "params" },
    { id: "gallery", label: "UI kit", icon: "dashboard" },
  ];
  const header = nav.find((n) => n.id === page)!;
  return (
    <AimProvider>
      <div className="app-shell">
        <nav className="nav-rail" aria-label="Main navigation">
          <div className="rail-brand" aria-label="Research">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M5 25V8l11 6L27 8v17M5 8l11 16L27 8"
                stroke="white"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
          {nav.map((n) => (
            <button
              key={n.id}
              className={"rail-link " + (page === n.id ? "active" : "")}
              onClick={() => setPage(n.id)}
              aria-current={page === n.id ? "page" : undefined}
            >
              <Icon name={n.icon} size={24} />
              {n.label}
            </button>
          ))}
          <div className="rail-foot">
            LOCAL
            <br />
            WORKSPACE
          </div>
        </nav>
        <main className="workspace">
          <div className="project-bar">
            <span className="project-name">Credit research</span>
            <span className="muted">/</span>
            <span className="project-context muted">Signal combination</span>
            <span className="spacer" />
            <Badge>Sample data</Badge>
            <span className="muted">H1 2026</span>
          </div>
          <div className="app-bar">
            <h1>
              {header.label === "RFQs"
                ? "RFQ explorer"
                : header.label === "UI kit"
                  ? "Component reference"
                  : header.label + " explorer"}
            </h1>
            <span className="spacer" />
            <span className="muted small">
              {runs.length} experiments · {metrics.length} metrics
            </span>
            <Button
              size="xSmall"
              variant="outlined"
              icon="runs"
              onClick={() => setPicker(true)}
            >
              Select runs
            </Button>
          </div>
          <div className="selection-strip">
            <span className="muted">Compare</span>
            {selectedRuns.slice(0, 5).map((r) => (
              <span key={r.id} className="selection-chip">
                <span className="dot" style={{ background: colour(r.id) }} />
                <span className="mono">{r.id}</span>
                {r.id === baseline && <span className="muted">baseline</span>}
                <button
                  onClick={() => toggle(r.id)}
                  aria-label={`Remove ${r.id}`}
                >
                  <Icon name="close" size={9} />
                </button>
              </span>
            ))}
            {selectedRuns.length > 5 && <span>+{selectedRuns.length - 5}</span>}
            {!selected.length && (
              <span className="muted">No runs selected</span>
            )}
            <div className="baseline-select">
              <span className="muted">Baseline</span>
              <Select
                label="Baseline run"
                value={baseline}
                onChange={setBaseline}
                options={
                  selectedRuns.length
                    ? selectedRuns.map((r) => ({ value: r.id, label: r.id }))
                    : [{ value: "", label: "None" }]
                }
              />
            </div>
          </div>
          {page === "runs" && (
            <RunsPage
              selected={selected}
              toggle={toggle}
              baseline={baseline}
              notify={setNotice}
              compare={() => setPage("metrics")}
            />
          )}
          {page === "metrics" && (
            <MetricsPage
              selectedRuns={selectedRuns}
              baseline={baseline}
              notify={setNotice}
            />
          )}
          {page === "rfqs" && (
            <RFQPage
              selectedRuns={selectedRuns}
              baseline={baseline}
              notify={setNotice}
            />
          )}
          {page === "training" && (
            <TrainingPage
              selectedRuns={selectedRuns}
              baseline={baseline}
              notify={setNotice}
            />
          )}
          {page === "gallery" && <Gallery />}
        </main>
      </div>
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title="Select experiments"
        actions={
          <Button variant="contained" onClick={() => setPicker(false)}>
            Apply selection
          </Button>
        }
      >
        <Input
          label="Find experiments"
          placeholder="Search ID, name or model"
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          icon="search"
        />
        <div className="modal-options">
          {runs
            .filter((r) =>
              [r.id, r.name, r.model].some((s) =>
                s.toLowerCase().includes(pickerQuery.toLowerCase()),
              ),
            )
            .map((r) => (
              <label key={r.id} className="modal-option">
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <span className="dot" style={{ background: colour(r.id) }} />
                <span>
                  <strong className="mono">{r.id}</strong>
                  <br />
                  <span className="muted small">{r.model}</span>
                </span>
              </label>
            ))}
        </div>
      </Modal>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
    </AimProvider>
  );
}
function RunsPage({
  selected,
  toggle,
  baseline,
  notify,
  compare,
}: {
  selected: string[];
  toggle: (id: string) => void;
  baseline: string;
  notify: (s: string) => void;
  compare: () => void;
}) {
  const [query, setQuery] = useState(""),
    [model, setModel] = useState("All"),
    [sort, setSort] = useState<Sort>({ key: "pnl", direction: "desc" }),
    [columnsOpen, setColumnsOpen] = useState(false),
    [density, setDensity] = useState<22 | 28 | 32>(28),
    [detail, setDetail] = useState<Run | null>(null);
  const [visible, setVisible] = useState([
    "pnl",
    "sharpe",
    "drawdown",
    "ic",
    "fillRate",
    "volume",
  ]);
  const filtered = useMemo(
    () =>
      sortRows(
        runs.filter(
          (r) =>
            (model === "All" || r.model === model) &&
            [r.id, r.name].some((s) =>
              s.toLowerCase().includes(query.toLowerCase()),
            ),
        ),
        (r) => (sort.key === "id" ? r.id : r.metrics[sort.key]),
        sort.direction,
      ),
    [query, model, sort],
  );
  const columns: Column<Run>[] = [
    {
      id: "id",
      label: "Run",
      width: 150,
      sticky: true,
      render: (r) => (
        <span className="run-cell">
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            aria-label={`Compare ${r.id}`}
            onChange={() => toggle(r.id)}
          />
          <span className="dot" style={{ background: colour(r.id) }} />
          <button className="text-button mono" onClick={() => setDetail(r)}>
            {r.id}
          </button>
        </span>
      ),
    },
    {
      id: "name",
      label: "Experiment",
      width: 210,
      render: (r) => <span title={r.name}>{r.name}</span>,
    },
    {
      id: "status",
      label: "Status",
      render: (r) => (
        <Badge
          tone={
            r.status === "failed"
              ? "negative"
              : r.status === "running"
                ? "blue"
                : "positive"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    ...visible.map((id) => {
      const m = metricMap.get(id)!;
      return {
        id,
        label: m.label,
        width: 145,
        numeric: true,
        render: (r: Run) => (
          <span>
            {formatNumber(r.metrics[id], m.unit, m.decimals)}
            {r.id === baseline && <span className="sr-only"> baseline</span>}
          </span>
        ),
      };
    }),
  ];
  return (
    <>
      <div className="query-bar">
        <Input
          label="Search runs"
          placeholder="Search run ID or experiment…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon="search"
        />
        <Select
          label="Model filter"
          value={model}
          onChange={setModel}
          options={["All", ...new Set(runs.map((r) => r.model))].map((m) => ({
            value: m,
            label: m === "All" ? "All models" : m,
          }))}
        />
        <span className="spacer" />
        <Select
          label="Table density"
          value={String(density)}
          onChange={(v) => setDensity(Number(v) as 22 | 28 | 32)}
          options={[
            { value: "22", label: "Compact · 22px" },
            { value: "28", label: "Default · 28px" },
            { value: "32", label: "Comfort · 32px" },
          ]}
        />
        <Button
          size="small"
          variant="outlined"
          icon="manage-column"
          onClick={() => setColumnsOpen(true)}
        >
          Columns
        </Button>
        <Button
          size="small"
          variant="contained"
          icon="compare"
          onClick={compare}
          disabled={!selected.length}
        >
          Compare {selected.length} runs
        </Button>
      </div>
      <div className="view-bar">
        <span>{filtered.length} runs</span>
        <span className="muted">Dataset: Credit RFQs · H1 2026</span>
        <span className="spacer" />
        <Button
          size="xSmall"
          icon="download"
          onClick={() => {
            downloadCSV(
              "runs.csv",
              ["run_id", "name", ...visible],
              filtered.map((r) => [
                r.id,
                r.name,
                ...visible.map((id) => r.metrics[id]),
              ]),
            );
            notify("Exported filtered runs and visible metrics");
          }}
        >
          Export CSV
        </Button>
      </div>
      <div className="main-scroll runs-table">
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          label="Experiment runs"
          sort={sort}
          onSort={(key) =>
            setSort({
              key,
              direction:
                sort.key === key && sort.direction === "desc" ? "asc" : "desc",
            })
          }
          density={density}
        />
      </div>
      <Modal
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        title="Choose table metrics"
        actions={
          <Button variant="contained" onClick={() => setColumnsOpen(false)}>
            Done
          </Button>
        }
      >
        <MetricChooser value={visible} onChange={setVisible} />
      </Modal>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.id} · Run details` : ""}
      >
        {detail && (
          <>
            <div className="panel-body">
              <h2>{detail.name}</h2>
              <p className="subtle-note">
                {detail.dataset} · {detail.createdAt}
              </p>
            </div>
            <table className="detail-table">
              <tbody>
                {Object.entries(detail.parameters).map(([k, v]) => (
                  <tr key={k}>
                    <td className="mono">{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel-body">
              <Badge tone={detail.status === "completed" ? "positive" : "blue"}>
                {detail.status}
              </Badge>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
function MetricChooser({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <>
      <Input
        label="Search metric columns"
        placeholder="Search metrics…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        icon="search"
      />
      <div className="modal-options">
        {metrics
          .filter((m) =>
            (m.label + " " + m.id + " " + m.group)
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((m) => (
            <label className="modal-option" key={m.id} title={m.description}>
              <input
                type="checkbox"
                checked={value.includes(m.id)}
                onChange={() =>
                  onChange(
                    value.includes(m.id)
                      ? value.filter((x) => x !== m.id)
                      : [...value, m.id],
                  )
                }
              />
              {m.label}
            </label>
          ))}
      </div>
    </>
  );
}
type SavedMetricView = {
  version: 1;
  metrics: string[];
  group: string;
  query: string;
};
function MetricsPage({
  selectedRuns,
  baseline,
  notify,
}: {
  selectedRuns: Run[];
  baseline: string;
  notify: (s: string) => void;
}) {
  const [chosen, setChosen] = useState(["pnl", "ic", "fillRate", "loss"]),
    [q, setQ] = useState(""),
    [group, setGroup] = useState("All"),
    [page, setPage] = useState(0),
    [onlyPinned, setOnlyPinned] = useState(false);
  const [pinned, setPinned] = usePersisted(
    "aim-research:pins:v1",
    ["pnl", "ic", "loss"],
    isStrings,
  );
  const matching = metrics.filter(
    (m) =>
      (m.label + " " + m.id).toLowerCase().includes(q.toLowerCase()) &&
      (group === "All" || m.group === group) &&
      (!onlyPinned || pinned.includes(m.id)),
  );
  const selectedMetrics = chosen
      .map((id) => metricMap.get(id))
      .filter((m): m is Metric => !!m),
    limit = 6,
    maxPage = Math.max(0, Math.ceil(selectedMetrics.length / limit) - 1),
    safePage = Math.min(page, maxPage);
  const base = selectedRuns.find((r) => r.id === baseline);
  const save = () => {
    try {
      localStorage.setItem(
        "aim-research:metric-view:v1",
        JSON.stringify({ version: 1, metrics: chosen, group, query: q }),
      );
      notify("Saved this metric view locally");
    } catch {
      notify("Storage unavailable; this view is kept for this session only");
    }
  };
  const restore = () => {
    try {
      const v = JSON.parse(
        localStorage.getItem("aim-research:metric-view:v1") || "null",
      ) as SavedMetricView;
      if (
        v?.version !== 1 ||
        !isStrings(v.metrics) ||
        typeof v.group !== "string" ||
        typeof v.query !== "string"
      )
        throw Error();
      setChosen(v.metrics.filter((id) => metricMap.has(id)));
      setGroup(["All", ...groups].includes(v.group) ? v.group : "All");
      setQ(v.query);
      setPage(0);
      notify("Restored metric view");
    } catch {
      notify("No valid saved view is available");
    }
  };
  return (
    <>
      <div className="query-bar">
        <span className="small muted">Metrics</span>
        {selectedMetrics.slice(0, 4).map((m) => (
          <Badge key={m.id} tone="blue">
            {m.id}
          </Badge>
        ))}
        {chosen.length > 4 && <Badge>+{chosen.length - 4}</Badge>}
        <span className="spacer" />
        <Button size="xSmall" icon="bookmarks" onClick={restore}>
          Load view
        </Button>
        <Button size="small" variant="outlined" icon="pin" onClick={save}>
          Save view
        </Button>
      </div>
      <div className="explorer-body">
        <aside className="metric-catalog" aria-label="Metric catalogue">
          <div className="catalog-head">
            <div className="row">
              <h2>Metrics</h2>
              <Badge>{metrics.length}</Badge>
            </div>
            <Input
              label="Search metrics"
              placeholder="Find metric or horizon…"
              icon="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select
              label="Metric group"
              value={group}
              onChange={setGroup}
              options={["All", ...groups].map((g) => ({
                value: g,
                label: g === "All" ? "All groups" : g,
              }))}
            />
            <label className="check-label">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
              />
              Pinned only
            </label>
          </div>
          <div className="catalog-options">
            {groups
              .filter((g) => matching.some((m) => m.group === g))
              .map((g) => (
                <React.Fragment key={g}>
                  <div className="catalog-group">
                    {g}
                    <span>{matching.filter((m) => m.group === g).length}</span>
                  </div>
                  {matching
                    .filter((m) => m.group === g)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={
                          "metric-option " +
                          (chosen.includes(m.id) ? "selected" : "")
                        }
                      >
                        <input
                          type="checkbox"
                          aria-label={`Show ${m.label}`}
                          checked={chosen.includes(m.id)}
                          onChange={() => {
                            setChosen(
                              chosen.includes(m.id)
                                ? chosen.filter((id) => id !== m.id)
                                : [...chosen, m.id],
                            );
                            setPage(0);
                          }}
                        />
                        <span title={m.description}>{m.label}</span>
                        <button
                          className={pinned.includes(m.id) ? "pinned" : ""}
                          aria-label={`${pinned.includes(m.id) ? "Unpin" : "Pin"} ${m.label}`}
                          onClick={() =>
                            setPinned(
                              pinned.includes(m.id)
                                ? pinned.filter((id) => id !== m.id)
                                : [...pinned, m.id],
                            )
                          }
                        >
                          <Icon name="pin" size={12} />
                        </button>
                      </div>
                    ))}
                </React.Fragment>
              ))}
            {!matching.length && (
              <Empty
                title="No matching metrics"
                detail="Try another name, group or horizon."
              />
            )}
          </div>
          <div className="catalog-foot">
            {chosen.length} selected · {matching.length} matching
          </div>
        </aside>
        <div className="explorer-main">
          {!selectedRuns.length ? (
            <Empty
              title="Select experiments"
              detail="Use Select runs to start comparing metrics."
            />
          ) : !selectedMetrics.length ? (
            <Empty
              title="Choose metrics"
              detail="Select metrics from the catalogue on the left."
            />
          ) : (
            <>
              <div className="view-bar">
                <span>{selectedMetrics.length} metrics</span>
                <span className="muted">
                  Aligned by trading day · raw values
                </span>
                <span className="spacer" />
                {maxPage > 0 && (
                  <>
                    <Button
                      size="xxSmall"
                      iconOnly
                      icon="arrow-left"
                      aria-label="Previous metric page"
                      disabled={safePage === 0}
                      onClick={() => setPage(safePage - 1)}
                    />
                    <span>
                      {safePage + 1}/{maxPage + 1}
                    </span>
                    <Button
                      size="xxSmall"
                      iconOnly
                      icon="arrow-right"
                      aria-label="Next metric page"
                      disabled={safePage === maxPage}
                      onClick={() => setPage(safePage + 1)}
                    />
                  </>
                )}
              </div>
              <div className="chart-grid">
                {selectedMetrics
                  .slice(safePage * limit, (safePage + 1) * limit)
                  .map((m) => (
                    <LineChart
                      key={m.id}
                      metric={m}
                      series={selectedRuns.map((r) => ({
                        id: r.id,
                        label: r.id,
                        color: colour(r.id),
                        points: r.series[m.id] || [],
                        baseline: r.id === baseline,
                      }))}
                    />
                  ))}
              </div>
              <div className="context-table">
                <div className="context-label">
                  <Icon name="compare" />
                  Comparison to {baseline}
                  <span className="spacer" />
                  <span className="subtle-note">
                    Run-level metrics · absolute differences
                  </span>
                </div>
                <DataTable
                  label="Metric comparison"
                  rows={selectedMetrics}
                  rowKey={(m) => m.id}
                  pageSize={12}
                  columns={[
                    {
                      id: "metric",
                      label: "Metric",
                      width: 180,
                      sticky: true,
                      render: (m) => (
                        <span title={m.description}>{m.label}</span>
                      ),
                    },
                    ...selectedRuns.map((r) => ({
                      id: r.id,
                      label: r.id,
                      width: 150,
                      numeric: true,
                      render: (m: Metric) => {
                        const d = delta(r.metrics[m.id], base?.metrics[m.id]);
                        return (
                          <span>
                            {formatNumber(r.metrics[m.id], m.unit, m.decimals)}
                            {r.id !== baseline && (
                              <span
                                className={
                                  "small " + deltaTone(d.absolute, m.direction)
                                }
                              >
                                　
                                {d.absolute === null
                                  ? "—"
                                  : `${d.absolute >= 0 ? "+" : ""}${formatNumber(d.absolute, m.unit === "%" ? "ratio" : m.unit, m.decimals)}${m.unit === "%" ? " pp" : ""}`}
                              </span>
                            )}
                          </span>
                        );
                      },
                    })),
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
function RFQPage({
  selectedRuns,
  baseline,
  notify,
}: {
  selectedRuns: Run[];
  baseline: string;
  notify: (s: string) => void;
}) {
  const [tab, setTab] = useState<"individual" | "summary">("individual"),
    [query, setQuery] = useState(""),
    [side, setSide] = useState<"All" | "Buy" | "Sell">("All"),
    [sector, setSector] = useState("All"),
    [population, setPopulation] = useState<Population>("common"),
    [cohort, setCohort] = useState<Cohort>("all"),
    [active, setActive] = useState("RFQ-10001"),
    [sort, setSort] = useState<Sort>({ key: "timestamp", direction: "asc" });
  const runIds = selectedRuns.map((r) => r.id),
    filtered = useMemo(
      () => filterRFQs(rfqs, { query, side, sector }),
      [query, side, sector],
    );
  const rows = useMemo(
    () =>
      sortRows(
        selectPopulation(filtered, index, runIds, baseline, population, cohort),
        (r) =>
          sort.key === "notional"
            ? r.notional
            : sort.key === "id"
              ? r.id
              : sort.key === "instrument"
                ? r.instrument
                : sort.key === "side"
                  ? r.side
                  : r.timestamp,
        sort.direction,
      ),
    [filtered, selectedRuns, baseline, population, cohort, sort],
  );
  const at = rows.findIndex((r) => r.id === active),
    safeAt = Math.max(0, at),
    rfq = rows[safeAt];
  useEffect(() => {
    if (at < 0 && rows.length) setActive(rows[0].id);
  }, [rows, at]);
  const move = (n: number) => {
    const next = rows[safeAt + n];
    if (next) setActive(next.id);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        tab !== "individual" ||
        el.closest(
          'input,textarea,select,[role="dialog"],[role="combobox"],[role="listbox"],[aria-haspopup],[contenteditable="true"]',
        ) ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [rows, safeAt, tab]);
  const summaries = selectedRuns.map((run) => ({
    run,
    ...summariseRFQs(rows, index, run.id),
    paired: pairedMarkoutDifference(rows, index, run.id, baseline),
  }));
  const exportRows = () => {
    downloadCSV(
      "rfq-comparison.csv",
      [
        "rfq_id",
        "timestamp",
        "instrument",
        "side",
        "notional_GBP",
        "run_id",
        "present",
        "decision",
        "filled",
        "quote_bp",
        "markout_bp",
        "pnl_GBP",
      ],
      rows.flatMap((r) =>
        selectedRuns.map((run) => {
          const o = index.get(run.id)?.get(r.id);
          return [
            r.id,
            r.timestamp,
            r.instrument,
            r.side,
            r.notional,
            run.id,
            o ? "yes" : "no",
            o?.decision,
            o ? String(o.filled) : null,
            o?.quoteBps,
            o?.markoutBps,
            o?.pnlGBP,
          ];
        }),
      ),
    );
    notify("Exported the current RFQ population across selected runs");
  };
  return (
    <>
      <div className="query-bar">
        <Input
          label="Search RFQs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="RFQ ID, instrument or sector…"
          icon="search"
        />
        <Select
          label="RFQ side"
          value={side}
          onChange={(v) => setSide(v as typeof side)}
          options={["All", "Buy", "Sell"].map((v) => ({
            value: v,
            label: v === "All" ? "Both sides" : v,
          }))}
        />
        <Select
          label="RFQ sector"
          value={sector}
          onChange={setSector}
          options={["All", "Financials", "Industrials", "Utilities"].map(
            (v) => ({ value: v, label: v === "All" ? "All sectors" : v }),
          )}
        />
        <span className="spacer" />
        <Button
          size="small"
          icon="download"
          variant="outlined"
          onClick={exportRows}
          disabled={!rows.length}
        >
          Export CSV
        </Button>
      </div>
      <div className="view-bar">
        <span>Population</span>
        <Select
          label="Comparison population"
          value={population}
          onChange={(v) => setPopulation(v as Population)}
          options={[
            { value: "common", label: "Common to all runs" },
            { value: "union", label: "Present in any run" },
            { value: "baseline", label: "Baseline RFQs" },
          ]}
        />
        <Select
          label="RFQ cohort"
          value={cohort}
          onChange={(v) => setCohort(v as Cohort)}
          options={[
            { value: "all", label: "All decisions" },
            { value: "filled-any", label: "Filled in any selected run" },
          ]}
        />
        <span className="muted">
          {rows.length} / {filtered.length} filtered RFQs
        </span>
      </div>
      <Tabs
        label="RFQ analysis view"
        value={tab}
        onChange={setTab}
        items={[
          { id: "individual", label: "Individual RFQs", count: rows.length },
          { id: "summary", label: "Summary comparison" },
        ]}
      />
      <div className="main-scroll">
        <div className="page-content">
          {selectedRuns.some((r) => !index.has(r.id)) && (
            <div className="notice warning">
              <Icon name="warning-outline" />
              The sample contains RFQ outcomes for BT-2601–BT-2608. A selected
              run without outcomes is missing, not untraded.
            </div>
          )}
          {!selectedRuns.length ? (
            <Empty
              title="Select backtests"
              detail="Choose backtest IDs to inspect their RFQ outcomes."
            />
          ) : tab === "individual" ? (
            <div className="rfq-layout">
              <Panel
                title="RFQ stream"
                subtitle="Select a row · J / K or ↑ / ↓ to navigate"
              >
                <DataTable
                  rows={rows}
                  rowKey={(r) => r.id}
                  selected={rfq?.id}
                  onRowClick={(r) => setActive(r.id)}
                  label="RFQ stream"
                  pageSize={18}
                  sort={sort}
                  onSort={(key) =>
                    setSort({
                      key,
                      direction:
                        sort.key === key && sort.direction === "asc"
                          ? "desc"
                          : "asc",
                    })
                  }
                  columns={[
                    {
                      id: "id",
                      label: "RFQ",
                      width: 115,
                      sticky: true,
                      render: (r) => (
                        <button
                          className="text-button mono"
                          onClick={() => setActive(r.id)}
                        >
                          {r.id}
                        </button>
                      ),
                    },
                    {
                      id: "timestamp",
                      label: "Time · UTC",
                      width: 85,
                      render: (r) => (
                        <span className="mono">
                          {r.timestamp.slice(11, 19)}
                        </span>
                      ),
                    },
                    {
                      id: "instrument",
                      label: "Instrument",
                      width: 160,
                      render: (r) => r.instrument,
                    },
                    {
                      id: "side",
                      label: "Side",
                      width: 60,
                      render: (r) => <Badge>{r.side}</Badge>,
                    },
                    {
                      id: "notional",
                      label: "Notional · GBP",
                      width: 130,
                      numeric: true,
                      render: (r) => formatNumber(r.notional, "GBP", 0),
                    },
                  ]}
                />
              </Panel>
              <Panel
                title={rfq?.id || "RFQ details"}
                subtitle={
                  rfq
                    ? `${safeAt + 1} of ${rows.length} in this population`
                    : "No RFQ selected"
                }
                actions={
                  <div className="detail-navigation">
                    <Button
                      size="xSmall"
                      iconOnly
                      icon="arrow-up"
                      aria-label="Previous RFQ"
                      disabled={!rfq || safeAt === 0}
                      onClick={() => move(-1)}
                    />
                    <Button
                      size="xSmall"
                      iconOnly
                      icon="arrow-down"
                      aria-label="Next RFQ"
                      disabled={!rfq || safeAt >= rows.length - 1}
                      onClick={() => move(1)}
                    />
                  </div>
                }
              >
                {rfq ? (
                  <RFQDetail
                    rfq={rfq}
                    selectedRuns={selectedRuns}
                    baseline={baseline}
                  />
                ) : (
                  <Empty
                    title="No matching RFQs"
                    detail="Change the filters or select a different population."
                  />
                )}
              </Panel>
            </div>
          ) : (
            <>
              <div className="summary-strip">
                <div className="summary-cell">
                  <small>Comparison population</small>
                  <strong>{rows.length}</strong>
                  <span>
                    {population === "common"
                      ? "Common to every selected run"
                      : population === "union"
                        ? "Present in at least one run"
                        : "Present in baseline"}
                  </span>
                </div>
                <div className="summary-cell">
                  <small>Selected backtests</small>
                  <strong>{selectedRuns.length}</strong>
                  <span>Baseline {baseline}</span>
                </div>
                <div className="summary-cell">
                  <small>RFQ notional</small>
                  <strong>
                    {formatNumber(
                      rows.reduce((a, r) => a + r.notional, 0) / 1e6,
                      "ratio",
                      1,
                    )}
                    m
                  </strong>
                  <span>GBP · unique RFQs, not summed over runs</span>
                </div>
                <div className="summary-cell">
                  <small>Eligible RFQs</small>
                  <strong>{filtered.length}</strong>
                  <span>Before population and execution cohort</span>
                </div>
              </div>
              <Panel
                title="Backtest comparison"
                subtitle="All statistics use the current RFQ population; available observations shown explicitly"
              >
                <DataTable
                  label="RFQ summary comparison"
                  rows={summaries}
                  rowKey={(s) => s.run.id}
                  columns={[
                    {
                      id: "run",
                      label: "Backtest",
                      width: 145,
                      sticky: true,
                      render: (s) => (
                        <span className="row">
                          <span
                            className="dot"
                            style={{ background: colour(s.run.id) }}
                          />
                          <span className="mono">{s.run.id}</span>
                          {s.run.id === baseline && <Badge>base</Badge>}
                        </span>
                      ),
                    },
                    {
                      id: "observed",
                      label: "Observed / missing",
                      width: 160,
                      numeric: true,
                      render: (s) => `${s.observed} / ${s.missing}`,
                    },
                    {
                      id: "quoted",
                      label: "Quoted",
                      numeric: true,
                      render: (s) => s.quoted,
                    },
                    {
                      id: "fills",
                      label: "Filled",
                      numeric: true,
                      render: (s) => s.fills,
                    },
                    {
                      id: "fillRate",
                      label: "Fill / quoted",
                      numeric: true,
                      render: (s) => formatNumber(s.fillRate, "%", 1),
                    },
                    {
                      id: "notional",
                      label: "Traded notional",
                      width: 150,
                      numeric: true,
                      render: (s) => formatNumber(s.tradedNotional, "GBP", 0),
                    },
                    {
                      id: "pnl",
                      label: "PnL · observed fills",
                      width: 170,
                      numeric: true,
                      render: (s) => (
                        <span>
                          {formatNumber(s.pnlGBP, "GBP", 0)}{" "}
                          <span className="muted small">n={s.pnlCount}</span>
                        </span>
                      ),
                    },
                    {
                      id: "markout",
                      label: "Mean markout",
                      width: 170,
                      numeric: true,
                      render: (s) => (
                        <span>
                          {formatNumber(s.meanMarkoutBps, "bps", 2)}{" "}
                          <span className="muted small">
                            n={s.markoutCount}
                          </span>
                        </span>
                      ),
                    },
                    {
                      id: "paired",
                      label: "Paired Δ markout",
                      width: 180,
                      numeric: true,
                      render: (s) =>
                        s.run.id === baseline ? (
                          "—"
                        ) : (
                          <span>
                            {formatNumber(s.paired.mean, "bps", 2)}{" "}
                            <span className="muted small">n={s.paired.n}</span>
                          </span>
                        ),
                    },
                  ]}
                />
              </Panel>
              <div className="notice">
                <Icon name="info-circle-outline" />
                Fill rate = filled / quoted. Mean markout uses non-missing
                filled observations. Paired Δ uses only RFQs filled in both the
                candidate and baseline with both markouts observed. PnL is a sum
                over observed fill PnLs; n exposes incomplete coverage.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
function RFQDetail({
  rfq,
  selectedRuns,
  baseline,
}: {
  rfq: RFQ;
  selectedRuns: Run[];
  baseline: string;
}) {
  const base = index.get(baseline)?.get(rfq.id),
    data = selectedRuns.map((run) => ({
      run,
      o: index.get(run.id)?.get(rfq.id),
    }));
  return (
    <>
      <dl className="detail-meta">
        <div>
          <dt>Instrument</dt>
          <dd>{rfq.instrument}</dd>
        </div>
        <div>
          <dt>Timestamp · UTC</dt>
          <dd className="mono">
            {rfq.timestamp.slice(0, 10)} {rfq.timestamp.slice(11, 19)}
          </dd>
        </div>
        <div>
          <dt>Side</dt>
          <dd>{rfq.side}</dd>
        </div>
        <div>
          <dt>Notional</dt>
          <dd>{formatNumber(rfq.notional, "GBP", 0)}</dd>
        </div>
        <div>
          <dt>Sector</dt>
          <dd>{rfq.sector}</dd>
        </div>
        <div>
          <dt>Tenor</dt>
          <dd>{rfq.tenor} years</dd>
        </div>
      </dl>
      <div className="table-scroll">
        <table className="detail-table" aria-label="RFQ outcomes by backtest">
          <thead>
            <tr>
              <th>Outcome</th>
              {data.map(({ run }) => (
                <th key={run.id}>
                  <span
                    className="dot"
                    style={{ background: colour(run.id), marginRight: 5 }}
                  />
                  <span className="mono">{run.id}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Presence</td>
              {data.map(({ run, o }) => (
                <td key={run.id}>
                  {o ? (
                    <Badge tone="positive">Observed</Badge>
                  ) : (
                    <Badge tone="warning">Missing</Badge>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>Decision</td>
              {data.map(({ run, o }) => (
                <td key={run.id}>{o?.decision || "—"}</td>
              ))}
            </tr>
            <tr>
              <td>Execution</td>
              {data.map(({ run, o }) => (
                <td key={run.id}>
                  {!o ? (
                    "—"
                  ) : o.filled ? (
                    <Badge tone="blue">Filled</Badge>
                  ) : (
                    "Not filled"
                  )}
                </td>
              ))}
            </tr>
            {(
              [
                { key: "alphaBps", label: "Alpha", unit: "bps" },
                { key: "quoteBps", label: "Quote spread", unit: "bps" },
                { key: "markoutBps", label: "Markout", unit: "bps" },
                { key: "pnlGBP", label: "Fill PnL", unit: "GBP" },
              ] as const
            ).map((m) => (
              <tr key={m.key}>
                <td>{m.label}</td>
                {data.map(({ run, o }) => {
                  const d = delta(o?.[m.key], base?.[m.key]);
                  return (
                    <td key={run.id}>
                      {formatNumber(
                        o?.[m.key],
                        m.unit,
                        m.unit === "GBP" ? 0 : 2,
                      )}
                      {run.id !== baseline && (
                        <span className="difference muted">
                          Δ{" "}
                          {formatNumber(
                            d.absolute,
                            m.unit,
                            m.unit === "GBP" ? 0 : 2,
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td>Reason</td>
              {data.map(({ run, o }) => (
                <td key={run.id}>{o?.reason || "No observation"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="detail-foot">
        Δ is candidate minus {baseline}. A dash means unavailable, never zero.
        Markouts and fill PnL are synthetic sample values; their horizon and
        valuation conventions must be supplied by the real backend.
      </div>
    </>
  );
}
function TrainingPage({
  selectedRuns,
  baseline,
  notify,
}: {
  selectedRuns: Run[];
  baseline: string;
  notify: (s: string) => void;
}) {
  const [model, setModel] = useState("Ridge"),
    [horizon, setHorizon] = useState("10"),
    [lookback, setLookback] = useState("120"),
    [alpha, setAlpha] = useState("1.0"),
    [seed, setSeed] = useState("42"),
    [error, setError] = useState("");
  const save = () => {
    if (
      ![horizon, lookback, seed].every(
        (x) => Number.isInteger(Number(x)) && Number(x) > 0,
      ) ||
      !Number.isFinite(Number(alpha)) ||
      Number(alpha) < 0
    ) {
      setError(
        "Use positive integers for horizon, lookback and seed, and a non-negative regularisation value.",
      );
      return;
    }
    setError("");
    const blob = new Blob(
      [
        JSON.stringify(
          {
            model,
            horizonDays: Number(horizon),
            lookbackDays: Number(lookback),
            regularisation: Number(alpha),
            seed: Number(seed),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const u = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = u;
    a.download = "training-config.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    notify("Exported training configuration");
  };
  return (
    <div className="main-scroll">
      <div className="page-content">
        <div className="training-layout">
          <Panel
            title="Training configuration"
            subtitle="Prepare and export a reproducible run configuration"
          >
            <div className="panel-body">
              <div className="form-grid">
                <label className="field">
                  Model
                  <Select
                    label="Training model"
                    value={model}
                    onChange={setModel}
                    options={["Ridge", "XGBoost", "Ridge + interactions"].map(
                      (v) => ({ value: v, label: v }),
                    )}
                  />
                </label>
                <label className="field">
                  Target horizon · days
                  <Input
                    label="Target horizon"
                    type="number"
                    value={horizon}
                    onChange={(e) => setHorizon(e.target.value)}
                    min="1"
                  />
                </label>
                <label className="field">
                  Lookback · days
                  <Input
                    label="Lookback"
                    type="number"
                    value={lookback}
                    onChange={(e) => setLookback(e.target.value)}
                    min="1"
                  />
                </label>
                <label className="field">
                  Regularisation
                  <Input
                    label="Regularisation"
                    type="number"
                    value={alpha}
                    onChange={(e) => setAlpha(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </label>
                <label className="field">
                  Random seed
                  <Input
                    label="Random seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    min="1"
                  />
                </label>
              </div>
              <p className="subtle-note" style={{ margin: "16px 0" }}>
                Training execution is supplied by your application. This
                template exports configuration and displays sample experiment
                diagnostics.
              </p>
              {error && (
                <p
                  role="alert"
                  className="negative small"
                  style={{ marginBottom: 12 }}
                >
                  {error}
                </p>
              )}
              <Button variant="contained" icon="download" onClick={save}>
                Export configuration
              </Button>
            </div>
          </Panel>
          <div className="chart-grid">
            {["loss", "mae", "ic", "pnl"].map((id) => (
              <LineChart
                key={id}
                metric={metricMap.get(id)!}
                xLabel={id === "loss" ? "Training step" : "Trading day"}
                series={selectedRuns.map((r) => ({
                  id: r.id,
                  label: r.id,
                  color: colour(r.id),
                  points: r.series[id],
                  baseline: r.id === baseline,
                }))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function Gallery() {
  const [tab, setTab] = useState("first"),
    [open, setOpen] = useState(false),
    [select, setSelect] = useState("a");
  return (
    <div className="main-scroll">
      <div className="page-content">
        <Panel
          title="Buttons"
          subtitle="Aim size map: 20 / 24 / 28 / 32 / 36px · source-derived MUI wrappers"
        >
          <div className="gallery-section">
            {(["xxSmall", "xSmall", "small", "medium", "large"] as const).map(
              (s) => (
                <Button
                  key={s}
                  size={s}
                  variant="contained"
                  onClick={() => setOpen(true)}
                >
                  {s}
                </Button>
              ),
            )}
            <Button variant="outlined" onClick={() => setOpen(true)}>
              Outlined
            </Button>
            <Button onClick={() => setOpen(true)}>Text</Button>
            <Button variant="contained" disabled>
              Disabled
            </Button>
            <Button
              iconOnly
              icon="manage-column"
              aria-label="Column settings"
              variant="outlined"
              onClick={() => setOpen(true)}
            />
          </div>
        </Panel>
        <Panel
          title="Inputs, badges and tabs"
          subtitle="Local fonts · exact Aim palette · explicit interaction states"
        >
          <div className="gallery-section">
            <Input
              label="Example search"
              placeholder="Search experiments…"
              icon="search"
            />
            <Select
              label="Example select"
              value={select}
              onChange={setSelect}
              options={[
                { value: "a", label: "Ridge" },
                { value: "b", label: "XGBoost" },
              ]}
            />
            <Badge>Neutral</Badge>
            <Badge tone="blue">Selected</Badge>
            <Badge tone="positive">Completed</Badge>
            <Badge tone="negative">Failed</Badge>
            <Badge tone="warning">Missing</Badge>
          </div>
          <Tabs
            label="Example tabs"
            value={tab}
            onChange={setTab}
            items={[
              { id: "first", label: "Overview", count: 24 },
              { id: "second", label: "Metrics", count: 60 },
              { id: "third", label: "Parameters" },
            ]}
          />
          <div className="panel-body">
            {tab === "first"
              ? "Overview content"
              : tab === "second"
                ? "Metric content"
                : "Parameter content"}
          </div>
        </Panel>
        <Panel
          title="Typography"
          subtitle="Original Inter variable font and Inconsolata asset from Aim"
        >
          <div className="gallery-section">
            {[10, 11, 12, 14, 16, 18, 24, 36].map((s) => (
              <span key={s} style={{ fontSize: s }}>
                Aa {s}
              </span>
            ))}
          </div>
          <div className="gallery-section">
            {[350, 450, 550, 650].map((w) => (
              <span key={w} style={{ fontWeight: w }}>
                Weight {w}
              </span>
            ))}
            <span className="mono">BT-2601 · alpha_scale = 0.40</span>
          </div>
        </Panel>
        <Panel
          title="Series palette and icons"
          subtitle="Stable run colours; semantic outcome colours are separate"
        >
          <div className="gallery-section">
            {PALETTE.map((c) => (
              <span key={c} className="row">
                <span
                  className="dot"
                  style={{ background: c, width: 12, height: 12 }}
                />
                <span className="mono">{c}</span>
              </span>
            ))}
          </div>
          <div className="gallery-section">
            {(
              [
                "runs",
                "metrics",
                "compare",
                "search",
                "manage-column",
                "pin",
                "download",
                "zoom-in",
                "params",
                "calendar",
                "info-circle-outline",
                "warning-outline",
              ] as IconName[]
            ).map((n) => (
              <span key={n} className="row" title={n}>
                <Icon name={n} />
                <span className="small">{n}</span>
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Empty state">
          <Empty
            title="No matching experiments"
            detail="Change your search or remove a filter to see more results."
            action={
              <Button variant="outlined" onClick={() => setOpen(true)}>
                Clear filters
              </Button>
            }
          />
        </Panel>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Component dialog"
          actions={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => setOpen(false)}>
                Apply
              </Button>
            </>
          }
        >
          <p className="small" style={{ padding: "16px 0" }}>
            Escape closes the dialog. Focus is trapped while open and restored
            to the trigger when closed.
          </p>
        </Modal>
      </div>
    </div>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
