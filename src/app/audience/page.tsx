"use client";

/* /audience — zero-login mobile page. React · Vote · Survey · Camera.
   Scan the QR on stage, land here, join the show. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useShow, useSlideContent } from "@/store/show";
import * as voteSlide from "@/slides/slides/05-live-vote";

const EMOJIS = ["🔥", "", "💙", "", "😮", ""];
const MOMENTS = ["OPENING STING", "THE GAMES", "AWARDS", "FINALE"];
const FACES = ["😡", "😐", "🙂", "🤩"];

export default function AudiencePage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const pollOpen = useShow((s) => s.pollOpen);
  const surveyOpen = useShow((s) => s.surveyOpen);
  const votes = useShow((s) => s.votes);
  const content = useSlideContent(voteSlide.meta.id, voteSlide.content);

  const [name, setName] = useState("");
  const [voted, setVoted] = useState<string | null>(null);
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    init();
    setName(localStorage.getItem("swag-name") ?? "");
    setVoted(localStorage.getItem("swag-voted"));
  }, [init]);

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const vote = (key: string) => {
    if (voted) return;
    dispatch({ type: "vote", option: key });
    localStorage.setItem("swag-voted", key);
    setVoted(key);
  };

  const sendSurvey = () => {
    if (!q1 || !q2) return;
    dispatch({ type: "survey", row: { q1, q2, q3, ts: Date.now() } });
    setSent(true);
  };

  return (
    <main className="page-light mx-auto flex min-h-screen max-w-md flex-col gap-5 bg-court px-5 py-6 text-ice">
      <header>
        <div className="font-body text-[11px] font-bold tracking-[0.4em] text-mag">SWAG DAY '26</div>
        <h1 className="mt-1 font-display text-4xl uppercase leading-none">
          Join the <span className="text-volt">hype</span>
        </h1>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem("swag-name", e.target.value);
          }}
          placeholder="your name (optional)"
          className="mt-4 w-full border-2 border-ice/15 bg-panel px-4 py-3 font-body text-[15px] outline-none focus:border-volt"
        />
      </header>

      {/* reactions */}
      <section>
        <div className="font-body text-[12px] font-bold tracking-[0.3em] text-ice/60">
          SEND A REACTION — IT FLIES ON THE BIG SCREEN
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => dispatch({ type: "reaction", emoji: e })}
              className="grid aspect-square place-items-center border-2 border-ice/15 bg-panel text-3xl active:scale-90 active:border-volt"
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {/* vote */}
      <section>
        <div className="flex items-center justify-between">
          <span className="font-body text-[12px] font-bold tracking-[0.3em] text-ice/60">
            LIVE VOTE · {content.boardTitle}
          </span>
          <span className={`font-body text-[12px] font-bold tracking-[0.2em] ${pollOpen ? "text-mag" : "text-ice/40"}`}>
            {pollOpen ? "● OPEN" : "WAITING FOR HOST"}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {content.options.map((o) => {
            const n = votes[o.key] ?? 0;
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <button
                key={o.key}
                onClick={() => vote(o.key)}
                disabled={!pollOpen || !!voted}
                className={`relative overflow-hidden border-2 px-4 py-3 text-left ${
                  voted === o.key ? "border-volt" : "border-ice/15"
                } ${pollOpen ? "bg-panel" : "bg-panel/40 opacity-60"}`}
              >
                {voted && (
                  <span className="absolute inset-y-0 left-0 bg-volt/20" style={{ width: `${pct}%` }} />
                )}
                <span className="relative flex items-center justify-between font-body text-[15px] font-bold tracking-[0.1em]">
                  <span>{o.name}</span>
                  {voted && <span className="text-volt tabular-nums">{pct}%</span>}
                </span>
              </button>
            );
          })}
        </div>
        {voted && <p className="mt-2 font-body text-[12px] text-ice/50">vote locked in. watch the stage.</p>}
      </section>

      {/* survey */}
      {surveyOpen && (
        <section className="border-2 border-vio/50 bg-vio/10 p-4">
          <div className="font-body text-[12px] font-bold tracking-[0.3em] text-vio">
            QUICK SURVEY — 3 QUESTIONS
          </div>
          {sent ? (
            <p className="mt-3 font-serifit text-2xl italic text-ice">thank you, legend. 💙</p>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <div className="font-body text-[13px] text-ice/70">1 · how was the show?</div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {FACES.map((f, i) => (
                    <button
                      key={f}
                      onClick={() => setQ1(i + 1)}
                      className={`grid aspect-square place-items-center border-2 text-2xl ${
                        q1 === i + 1 ? "border-volt bg-volt/20" : "border-ice/15"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-body text-[13px] text-ice/70">2 · best moment?</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOMENTS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setQ2(m)}
                      className={`border-2 px-2 py-2 font-body text-[12px] font-bold tracking-[0.12em] ${
                        q2 === m ? "border-volt text-volt" : "border-ice/15 text-ice/70"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-body text-[13px] text-ice/70">3 · one word for the teachers?</div>
                <input
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  className="mt-2 w-full border-2 border-ice/15 bg-court px-3 py-2 font-body text-[15px] outline-none focus:border-volt"
                />
              </div>
              <button
                onClick={sendSurvey}
                className="border-2 border-volt bg-volt py-3 font-display text-xl uppercase text-court"
              >
                Send it
              </button>
            </div>
          )}
        </section>
      )}

      <Link
        href="/camera"
        className="border-2 border-mag px-4 py-3 text-center font-body text-[14px] font-bold tracking-[0.25em] text-mag"
      >
        🎥 GO LIVE ON THE STAGE SCREEN
      </Link>

      <p className="pb-4 text-center font-body text-[11px] tracking-[0.25em] text-ice/35">
        SWAG DAY FS · SUIT UP! SHOW UP! SPORT IT UP!
      </p>
    </main>
  );
}
