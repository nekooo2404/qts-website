import { useMemo, useState } from "react";

export type Point = { label: string; value: number };

function formatValue(value: number, unit: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === " tỷ") return `${value.toFixed(2)} tỷ`;
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function TrendChart({
  title,
  description,
  points,
  unit = "",
  tableLabel,
}: {
  title: string;
  description: string;
  points: Point[];
  unit?: "" | "%" | " tỷ";
  tableLabel: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const chartId = title.replace(/\s+/g, "-").toLowerCase();
  const geometry = useMemo(() => {
    if (!points.length) return null;
    const width = 640;
    const height = 224;
    const padding = { top: 16, right: 20, bottom: 31, left: 42 };
    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const spread = Math.max(maxValue - minValue, Math.max(maxValue * .08, 1));
    const min = Math.max(0, minValue - spread * .28);
    const max = maxValue + spread * .28;
    const x = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(points.length - 1, 1);
    const y = (value: number) => padding.top + (max - value) * (height - padding.top - padding.bottom) / (max - min);
    const coords = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
    const path = coords.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const area = `${path} L${coords.at(-1)?.x ?? 0},${height - padding.bottom} L${coords[0]?.x ?? 0},${height - padding.bottom} Z`;
    const ticks = Array.from({ length: 4 }, (_, index) => min + ((max - min) * index) / 3).reverse();
    return { width, height, padding, coords, path, area, ticks, y };
  }, [points]);
  if (!geometry) return <figure className="chart-figure">
    <figcaption><div><h2>{title}</h2><p>{description}</p></div></figcaption>
    <div className="chart-wrap"><p className="chart-empty">Chưa có dữ liệu biểu đồ chính thức.</p></div>
  </figure>;

  return <figure className="chart-figure">
    <figcaption><div><h2>{title}</h2><p>{description}</p></div></figcaption>
    <div className="chart-wrap">
      <svg className="trend-chart" viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-labelledby={`${chartId}-label`} onMouseLeave={() => setHovered(null)}>
        <title id={`${chartId}-label`}>{tableLabel}</title>
        {geometry.ticks.map((tick) => <g key={tick}>
          <line x1={geometry.padding.left} x2={geometry.width - geometry.padding.right} y1={geometry.y(tick)} y2={geometry.y(tick)} className="chart-grid" />
          <text x={geometry.padding.left - 8} y={geometry.y(tick) + 4} className="chart-axis" textAnchor="end">{formatValue(tick, unit)}</text>
        </g>)}
        <path d={geometry.area} className="chart-area" />
        <path d={geometry.path} className="chart-line" />
        {geometry.coords.map((point, index) => <g key={points[index].label}>
          <line x1={point.x} x2={point.x} y1={geometry.padding.top} y2={geometry.height - geometry.padding.bottom} className={hovered === index ? "chart-crosshair visible" : "chart-crosshair"} />
          <circle cx={point.x} cy={point.y} r="5" className={hovered === index ? "chart-dot active" : "chart-dot"} />
          <rect x={point.x - 18} y={geometry.padding.top} width="36" height={geometry.height - geometry.padding.top - geometry.padding.bottom} className="chart-hit" onMouseEnter={() => setHovered(index)} />
          {(index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)) && <text x={point.x} y={geometry.height - 9} className="chart-axis" textAnchor="middle">{points[index].label}</text>}
        </g>)}
      </svg>
      {hovered !== null && <div className="chart-tooltip" style={{ left: `${(geometry.coords[hovered].x / geometry.width) * 100}%`, top: `${(geometry.coords[hovered].y / geometry.height) * 100}%` }}><span>{points[hovered].label}</span><b>{formatValue(points[hovered].value, unit)}</b></div>}
    </div>
    <details className="chart-table"><summary>Xem dữ liệu dạng bảng</summary><table><thead><tr><th>Kỳ</th><th>{tableLabel}</th></tr></thead><tbody>{points.map((point) => <tr key={point.label}><td>{point.label}</td><td>{formatValue(point.value, unit)}</td></tr>)}</tbody></table></details>
  </figure>;
}

export function ColumnChart({
  title,
  description,
  points,
  unit = " tỷ",
  tableLabel,
}: {
  title: string;
  description: string;
  points: Point[];
  unit?: "" | "%" | " tỷ";
  tableLabel: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const chartId = title.replace(/\s+/g, "-").toLowerCase();
  if (!points.length) return <figure className="chart-figure">
    <figcaption><div><h2>{title}</h2><p>{description}</p></div></figcaption>
    <div className="chart-wrap"><p className="chart-empty">Chưa có dữ liệu biểu đồ chính thức.</p></div>
  </figure>;
  const highest = Math.max(...points.map((point) => point.value));
  const width = 640;
  const height = 224;
  const base = 190;
  const left = 40;
  const available = 580;
  const slot = available / points.length;
  return <figure className="chart-figure">
    <figcaption><div><h2>{title}</h2><p>{description}</p></div></figcaption>
    <div className="chart-wrap">
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${chartId}-label`} onMouseLeave={() => setHovered(null)}>
        <title id={`${chartId}-label`}>{tableLabel}</title>
        {[0, 1, 2, 3].map((index) => { const y = 18 + index * 57; return <line key={index} x1={left} x2={width - 20} y1={y} y2={y} className="chart-grid" />; })}
        <line x1={left} x2={width - 20} y1={base} y2={base} className="chart-baseline" />
        {points.map((point, index) => {
          const barHeight = Math.max(5, (point.value / highest) * 158);
          const x = left + index * slot + (slot - 18) / 2;
          const y = base - barHeight;
          return <g key={point.label}>
            <rect x={x} y={y} width="18" height={barHeight} rx="4" className={hovered === index ? "chart-bar active" : "chart-bar"} onMouseEnter={() => setHovered(index)} />
            {(index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)) && <text x={x + 9} y="211" className="chart-axis" textAnchor="middle">{point.label}</text>}
          </g>;
        })}
      </svg>
      {hovered !== null && <div className="chart-tooltip" style={{ left: `${((left + hovered * slot + slot / 2) / width) * 100}%`, top: `${(base - (points[hovered].value / highest) * 158) / height * 100}%` }}><span>{points[hovered].label}</span><b>{formatValue(points[hovered].value, unit)}</b></div>}
    </div>
    <details className="chart-table"><summary>Xem dữ liệu dạng bảng</summary><table><thead><tr><th>Kỳ</th><th>{tableLabel}</th></tr></thead><tbody>{points.map((point) => <tr key={point.label}><td>{point.label}</td><td>{formatValue(point.value, unit)}</td></tr>)}</tbody></table></details>
  </figure>;
}
