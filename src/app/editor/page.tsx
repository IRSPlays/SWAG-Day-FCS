"use client";

/* /editor — manual quick-edit console.
   Edits are DATA ONLY: content overrides + meta patches, broadcast live
   to stage/controller and persisted locally. Motion code stays untouchable. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useShow } from "@/store/show";
import { useDeckIds } from "@/store/deckSelect";
import { deck } from "@/slides/deck";
import { transitionIds } from "@/transitions";

type Obj = Record<string, unknown>;

const input =
  "w-full border-2 border-ice/15 bg-panel px-3 py-2 font-body text-[14px] text-ice outline-none focus:border-volt";

function setAt(obj: Obj, path: string[], value: unknown): Obj {
  const [k, ...rest] = path;
  const out: Obj = { ...obj };
  if (rest.length === 0) out[k] = value;
  else out[k] = setAt((obj[k] ?? {}) as Obj, rest, value);
  return out;
}

function deepMerge(base: unknown, patch: unknown): unknown {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch))
    return patch === undefined ? base : patch;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return patch;
  const out: Obj = { ...(base as Obj) };
  for (const [k, v] of Object.entries(patch as Obj)) out[k] = deepMerge(out[k], v);
  return out;
}

function Fields({
  node,
  path,
  onSet,
}: {
  node: unknown;
  path: string[];
  onSet: (p: string[], v: unknown) => void;
}) {
  if (typeof node === "string")
    return <input className={input} value={node} onChange={(e) => onSet(path, e.target.value)} />;
  if (typeof node === "number")
    return (
      <input
        type="number"
        className={input}
        value={node}
        onChange={(e) => onSet(path, Number(e.target.value))}
      />
    );
  if (Array.isArray(node)) {
    if (node.every((x) => typeof x === "string"))
      return (
        <textarea
          rows={4}
          className={input}
          value={node.join("\n")}
          onChange={(e) => onSet(path, e.target.value.split("\n"))}
        />
      );
    return (
      <div className="flex flex-col gap-3">
        {node.map((item, i) => (
          <div key={i} className="border-2 border-ice/10 bg-ice/5 p-3">
            <div className="mb-2 font-body text-[11px] font-bold tracking-[0.25em] text-volt">
              ITEM {i + 1}
            </div>
            <Fields node={item} path={[...path, String(i)]} onSet={onSet} />
          </div>
        ))}
      </div>
    );
  }
  if (node && typeof node === "object")
    return (
      <div className="flex flex-col gap-3">
        {Object.entries(node as Obj).map(([k, v]) => (
          <label key={k} className="block">
            <div className="mb-1 font-body text-[11px] font-bold uppercase tracking-[0.25em] text-ice/50">
              {k}
            </div>
            <Fields node={v} path={[...path, k]} onSet={onSet} />
          </label>
        ))}
      </div>
    );
  return null;
}

export default function EditorPage() {
  const init = useShow((s) => s.init);
  const dispatch = useShow((s) => s.dispatch);
  const overrides = useShow((s) => s.overrides);
  const metaOv = useShow((s) => s.metaOv);
  const ids = useDeckIds();
  const [sel, setSel] = useState("");

  useEffect(() => {
    init();
  }, [init]);

  const selected = sel || ids[0] || "opening-sting";
  const mod = deck.find((m) => m.meta.id === selected);
  const defaults = useMemo(
    () => ((mod as unknown as { content?: Obj } | undefined)?.content ?? {}) as Obj,
    [mod]
  );
  if (!mod) return null;

  const patch = overrides[selected] ?? {};
  const merged = deepMerge(defaults, patch) as Obj;
  const meta = { ...mod.meta, ...(metaOv[selected] ?? {}) };

  const onSet = (p: string[], v: unknown) =>
    dispatch({ type: "override", slideId: selected, patch: setAt(patch as Obj, p, v) });

  return (
    <div className="page-light flex min-h-screen flex-col bg-court text-ice">
      <header className="flex items-center justify-between border-b-2 border-ice/10 px-5 py-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl uppercase">Editor</span>
          <span className="font-serifit italic text-ice/50">quick edits, live on stage</span>
        </div>
        <div className="flex items-center gap-4 font-body text-[12px] font-bold tracking-[0.25em]">
          <Link className="text-ice/60 hover:text-volt" href="/controller">CONTROLLER</Link>
          <Link className="text-ice/60 hover:text-volt" href="/stage">STAGE</Link>
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[300px_1fr]">
        {/* slide list */}
        <div className="flex flex-col gap-1.5">
          {ids.map((id, i) => {
            const m = deck.find((x) => x.meta.id === id);
            if (!m) return null;
            return (
              <button
                key={id}
                onClick={() => setSel(id)}
                className={`border-2 px-3 py-2 text-left font-body text-[13px] font-bold tracking-[0.15em] ${
                  id === selected
                    ? "border-volt bg-volt/10 text-volt"
                    : "border-ice/10 text-ice/70 hover:border-ice/30"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {m.meta.title.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* edit panel */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 border-2 border-ice/10 bg-panel/60 p-4">
            <label className="font-body text-[12px] font-bold tracking-[0.2em] text-ice/60">
              TRANSITION{" "}
              <select
                value={meta.transition}
                onChange={(e) =>
                  dispatch({ type: "meta", slideId: selected, patch: { transition: e.target.value } })
                }
                className="ml-2 border-2 border-ice/15 bg-court px-2 py-1 text-ice"
              >
                {transitionIds.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-body text-[12px] font-bold tracking-[0.2em] text-ice/60">
              SECONDS{" "}
              <input
                type="number"
                value={meta.durationHint ?? 10}
                onChange={(e) =>
                  dispatch({
                    type: "meta",
                    slideId: selected,
                    patch: { durationHint: Number(e.target.value) },
                  })
                }
                className="ml-2 w-20 border-2 border-ice/15 bg-court px-2 py-1 text-ice"
              />
            </label>
            <button
              onClick={() => {
                dispatch({ type: "override", slideId: selected, patch: null });
                dispatch({ type: "meta", slideId: selected, patch: null });
              }}
              className="ml-auto border-2 border-mag px-3 py-1 font-body text-[12px] font-bold tracking-[0.2em] text-mag hover:bg-mag hover:text-ice"
            >
              RESET TO FILE
            </button>
          </div>

          <label className="block border-2 border-ice/10 bg-panel/60 p-4">
            <div className="mb-1 font-body text-[11px] font-bold uppercase tracking-[0.25em] text-ice/50">
              speaker notes
            </div>
            <textarea
              rows={2}
              className={input}
              value={meta.notes ?? ""}
              onChange={(e) =>
                dispatch({ type: "meta", slideId: selected, patch: { notes: e.target.value } })
              }
            />
          </label>

          <div className="border-2 border-ice/10 bg-panel/60 p-4">
            <div className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.25em] text-volt">
              slide content — edits go live instantly
            </div>
            <Fields node={merged} path={[]} onSet={onSet} />
          </div>
        </section>
      </main>
    </div>
  );
}
