"use client";

/* Deck selection helpers — kept OUT of show.ts to avoid the
   store ⇄ deck circular import (slides import the store). */

import { useMemo } from "react";
import { deck } from "@/slides/deck";
import type { SlideModule } from "@/slides/types";
import { useShow } from "./show";

/* running-order resolution: the stored order wins, BUT slide files added
   after it was saved are appended (in file order) instead of being invisible.
   Unknown/stale ids are dropped. This keeps /stage + /controller in sync with
   the deck manifest even across older saved state. */
function effectiveIds(order: string[]): string[] {
  const file = deck.map((m) => m.meta.id);
  const base = order.length ? order.filter((id) => file.includes(id)) : [];
  const merged = [...base];
  for (const id of file) if (!merged.includes(id)) merged.push(id);
  return merged;
}

export function effectiveDeck(order: string[], hidden: string[]): SlideModule[] {
  return effectiveIds(order)
    .filter((id) => !hidden.includes(id))
    .map((id) => deck.find((m) => m.meta.id === id))
    .filter((m): m is SlideModule => Boolean(m));
}

/** running order ids, falling back to the file deck before any deck event —
    always merged with the manifest so newly added slides appear everywhere */
export function useDeckIds(): string[] {
  const order = useShow((s) => s.order);
  return useMemo(() => effectiveIds(order), [order]);
}

export function useEffectiveDeck(): SlideModule[] {
  const ids = useDeckIds();
  const hidden = useShow((s) => s.hidden);
  const metaOv = useShow((s) => s.metaOv);
  return useMemo(
    () =>
      effectiveDeck(ids, hidden).map((m) =>
        metaOv[m.meta.id]
          ? { ...m, meta: { ...m.meta, ...(metaOv[m.meta.id] as Partial<SlideModule["meta"]>) } }
          : m
      ),
    [ids, hidden, metaOv]
  );
}
