import { dayIST } from "./format";

export interface Bucket { start: number; count: number; avg: number | null }

/** Checks per period (bars) and average score of full reports (line). Plain SVG, no library. */
export default function ActivityChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(4, ...buckets.map((b) => b.count));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => 50 + i * (540 / buckets.length) + 270 / buckets.length;
  const y = (v: number) => 170 - (v / top) * 145;
  const ys = (v: number) => 170 - (v / 100) * 145;
  const line = buckets.map((b, i) => ({ ...b, i })).filter((b) => b.avg !== null);
  return (
    <svg className="chart" viewBox="0 0 640 205" role="img" aria-label={`${buckets.reduce((s, b) => s + b.count, 0)} checks in this period`}>
      {[0, 1, 2, 3, 4].map((k) => <g key={k}><line x1="50" x2="590" y1={y(k * step)} y2={y(k * step)} stroke="#e7ebf0" /><text x="42" y={y(k * step) + 4} textAnchor="end">{k * step}</text></g>)}
      {[0, 50, 100].map((v) => <text key={v} x="598" y={ys(v) + 4} fill="#a85b00">{v}</text>)}
      {buckets.map((b, i) => <rect key={b.start} x={x(i) - 14} y={y(b.count)} width="28" height={170 - y(b.count)} rx="3" fill="#7cb8f7"><title>{`${dayIST(b.start)}: ${b.count} checked${b.avg === null ? "" : `, average score ${b.avg}`}`}</title></rect>)}
      {buckets.map((b, i) => <text key={b.start} x={x(i)} y="192" textAnchor="middle">{dayIST(b.start)}</text>)}
      {line.length > 1 && <polyline points={line.map((b) => `${x(b.i)},${ys(b.avg!)}`).join(" ")} fill="none" stroke="#e67a00" strokeWidth="2.500" />}
      {line.map((b) => <circle key={b.start} cx={x(b.i)} cy={ys(b.avg!)} r="3.500" fill="#e67a00" />)}
    </svg>
  );
}
