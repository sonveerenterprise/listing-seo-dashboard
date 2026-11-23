import type { Block } from "@/contract";

const Pill = ({ p }: { p: string }) => (/^P[012]$/.test(p) ? <span className={`pill ${p}`}>{p}</span> : <>{p}</>);

function Locked({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="lockedbox">
      <div className="blurlines" aria-hidden="true"><i /><i /><i /><i /></div>
      <div>🔒 <b>{title}</b> <span className="muted">— {detail}</span></div>
    </div>
  );
}

const More = ({ n, one, many = one + "s" }: { n: number; one: string; many?: string }) =>
  n > 0 ? <div className="lockedbox slim">🔒 {n} more {n === 1 ? one : many} in the full report</div> : null;

export default function SectionBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "score":
            return (
              <div className="panel" key={i}>
                <div className="scorebig">
                  <div className="num">{b.score}</div>
                  <div>
                    <span className={`status ${b.status.replace(/\s/g, "")}`}>{b.status}</span>
                    <div className="muted">Listing SEO Score / 100{b.rawScore > b.score ? ` (capped from ${b.rawScore} by blockers)` : ""}</div>
                  </div>
                </div>
                {b.summary && <p>{b.summary}</p>}
                {b.pillars ? (
                  <div className="pillars">
                    {b.pillars.map((p) => (
                      <div className="pillar" key={p.name}>
                        <b>{p.name}</b>
                        <div>{p.earned}/{p.available}{p.percent === null ? " · N/A" : ""}</div>
                        <div className="bar"><i style={{ width: `${p.percent ?? 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Locked title="Pillar scores" detail="search visibility, rule compliance, conversion copy, catalogue, claims and AI readiness" />
                )}
              </div>
            );
          case "issues":
            return (
              <div className="panel" key={i}>
                <h3>{b.title}</h3>
                {b.items.length === 0 && b.hidden === 0 && <p className="muted">No problems found here. ✅</p>}
                {b.items.map((it, j) => (
                  <div className="issue" key={j}>
                    <div className="prob"><Pill p={it.severity} /> <b>Problem:</b> {it.problem}</div>
                    {it.solution && <div className="sol"><b>Solution:</b> {it.solution}</div>}
                  </div>
                ))}
                <More n={b.hidden} one="problem with its solution" many="problems with their solutions" />
              </div>
            );
          case "text":
            if (b.items.length === 0 && b.hidden === 0) return null;
            return (
              <div className="panel" key={i}>
                <h3>{b.title}</h3>
                {b.items.map((t, j) => (
                  <div key={j} style={{ marginBottom: 10 }}>
                    {(t.label || t.meta) && <div className="muted small">{t.label}{t.label && t.meta ? " · " : ""}{t.meta}</div>}
                    <pre className={`copy ${b.tone === "current" ? "current" : ""}`}>{t.text}</pre>
                  </div>
                ))}
                {b.hidden > 0 && (b.items.length === 0 ? <Locked title={b.title} detail="unlock the full report to copy it" /> : <More n={b.hidden} one="rewritten item" />)}
              </div>
            );
          case "table":
            return (
              <div className="panel" key={i}>
                <h3>{b.title}</h3>
                {b.rows.length === 0 ? <p className="muted">None found.</p> : (
                  <div className="tw">
                    <table className="simple">
                      <thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                      <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Pill p={c} /></td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
                <More n={b.hidden} one="row" />
              </div>
            );
          case "locked":
            return <div className="panel" key={i}><h3>{b.title}</h3><Locked title={b.title} detail={b.detail} /></div>;
        }
      })}
    </>
  );
}
