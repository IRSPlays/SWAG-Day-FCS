"use client";

/* Deck selection helpers — kept OUT of show.ts to avoid the
   store ⇄ deck circular import (slides import the store). */

import { useMemo } from "react";
import { deck } from "@/slides/deck";
import type { SlideModule } from "@/slides/types";
import { useShow } from "./show";

export function effectiveDeck(order: string[], hidden: string[]): SlideModule[] {
  return order
    .filter((id) => !hidden.includes(id))
    .map((id) => deck.find((m) => m.meta.id === id))
    .filter((m): m is SlideModule => Boolean(m));
}

/** running order ids, falling back to the file deck before any deck event */
export function useDeckIds(): string[] {
  const order = useShow((s) => s.order);
  return useMemo(
    () => (order.length ? order : deck.map((m) => m.meta.id)),
    [order]
  );
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
