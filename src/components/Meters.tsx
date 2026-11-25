import type { Meter } from "@/contract";
import { band, bandLabel } from "./format";

const ARC = 125.6;
const COLOR = { ok: "#158a3e", warn: "#ff8a00", bad: "#d0342c" } as const;

/** The quick-score gauges. A meter without data says so instead of showing a number. */
export default function Meters({ meters }: { meters: Meter[] }) {
  return (
    <div className="meters">
      {meters.map((m) => (
        <div className="meter" key={m.key}>
          <svg viewBox="0 0 100 60" role="img" aria-label={`${m.label}: ${m.score === null ? "not checked" : `${m.score} out of 100`}`}>
            <path d="M10 52a40 40 0 0 1 80 0" fill="none" stroke="#e7ebf0" strokeWidth="11" strokeLinecap="round" />
            {m.score !== null && m.score > 0 && <path d="M10 52a40 40 0 0 1 80 0" fill="none" stroke={COLOR[band(m.score)]} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(ARC * m.score) / 100} ${ARC}`} />}
          </svg>
          <b className={m.score === null ? "muted" : band(m.score)}>{m.score ?? "–"}</b>
          <div>{m.label}</div>
          <div className={`small ${m.score === null ? "muted" : band(m.score)}`}>{m.score === null ? "Not checked" : bandLabel(m.score)}</div>
        </div>
      ))}
    </div>
  );
}
