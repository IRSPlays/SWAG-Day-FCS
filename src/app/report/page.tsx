"use client";

/* /report — post-event analytics. Reactions, votes, survey, CSV export. */

import { useEffect } from "react";
import Link from "next/link";
import { useShow } from "@/store/show";
import * as voteSlide from "@/slides/slides/05-live-vote";

const FACES = ["😡", "😐", "🙂", "🤩"];

export default function ReportPage() {
  const init = useShow((s) => s.init);
  const reactionCounts = useShow((s) => s.reactionCounts);
  const votes = useShow((s) => s.votes);
  const surveys = useShow((s) => s.surveys);

  useEffect(() => {
    init();
  }, [init]);

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const avgRating = surveys.length
    ? surveys.reduce((a, r) => a + r.q1, 0) / surveys.length
    : 0;
  const momentCounts = surveys.reduce<Record<string, number>>((acc, r) => {
    acc[r.q2] = (acc[r.q2] ?? 0) + 1;
    return acc;
  }, {});

  const exportCsv = () => {
    const rows: string[][] = [["type", "field", "value"]];
    Object.entries(reactionCounts).forEach(([e, n]) => rows.push(["reaction", e, String(n)]));
    Object.entries(votes).forEach(([k, n]) => rows.push(["vote", k, String(n)]));
    surveys.forEach((r, i) =>
      rows.push([`survey-${i + 1}`, "rating|moment|word", `${r.q1}|${r.q2}|${r.q3}`])
    );
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "swag-day-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const card = "border-2 border-ice/10 bg-panel/60 p-5";
  const label = "font-body text-[12px] font-bold tracking-[0.3em] text-ice/50";

  return (
    <main className="page-light mx-auto flex min-h-screen max-w-5xl flex-col gap-5 bg-court px-6 py-8 text-ice">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">
            POST-EVENT AUDIT
          </div>
          <h1 className="mt-1 font-display text-5xl uppercase leading-none">
            The <span className="text-volt">report</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCsv}
            className="border-2 border-volt bg-volt px-4 py-2 font-body text-[13px] font-bold tracking-[0.2em] text-court"
          >
            EXPORT CSV
          </button>
          <Link
            href="/controller"
            className="border-2 border-ice/25 px-4 py-2 font-body text-[13px] font-bold tracking-[0.2em] text-ice/70"
          >
            CONTROLLER
          </Link>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <div className={card}>
          <div className={label}>REACTIONS FLOWN</div>
          <div className="mt-2 font-display text-6xl text-volt tabular-nums">{totalReactions}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(reactionCounts).map(([e, n]) => (
              <span key={e} className="border-2 border-ice/15 px-2 py-1 text-lg">
                {e} <span className="font-body text-sm text-ice/60 tabular-nums">×{n}</span>
              </span>
            ))}
            {totalReactions === 0 && <span className="text-ice/40">none yet</span>}
          </div>
        </div>

        <div className={card}>
          <div className={label}>MVP VOTES</div>
          <div className="mt-2 font-display text-6xl text-mag tabular-nums">{totalVotes}</div>
          <div className="mt-3 flex flex-col gap-1">
            {voteSlide.content.options.map((o) => {
              const n = votes[o.key] ?? 0;
              const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0;
              return (
                <div key={o.key} className="flex items-center justify-between font-body text-sm">
                  <span className="text-ice/70">{o.name}</span>
                  <span className="text-volt tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <div className={label}>SURVEY · AVG RATING</div>
          <div className="mt-2 font-display text-6xl text-vio tabular-nums">
            {avgRating ? avgRating.toFixed(1) : "—"}
            <span className="text-2xl text-ice/40"> / 4</span>
          </div>
          <div className="mt-3 flex gap-2">
            {FACES.map((f, i) => {
              const n = surveys.filter((r) => r.q1 === i + 1).length;
              return (
                <span key={f} className="border-2 border-ice/15 px-2 py-1 text-lg">
                  {f} <span className="font-body text-sm text-ice/60 tabular-nums">{n}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={card}>
          <div className={label}>BEST MOMENT</div>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(momentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([m, n]) => (
                <div key={m} className="flex items-center justify-between font-body text-sm">
                  <span className="text-ice/70">{m}</span>
                  <span className="text-volt tabular-nums">×{n}</span>
                </div>
              ))}
            {surveys.length === 0 && <span className="text-ice/40">no surveys yet</span>}
          </div>
        </div>

        <div className={card}>
          <div className={label}>ONE WORD FOR THE TEACHERS</div>
          <p className="mt-3 font-serifit text-2xl italic leading-snug text-ice/85">
            {surveys
              .map((r) => r.q3)
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>
    </main>
  );
}
