"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "./modal";

export type PhotoItem = { src: string; caption: string };

type Labels = {
  title: string;
  seeAll: string;
  photosCount: string;
  backToGrid: string;
  photo: string;
  previous: string;
  next: string;
  close: string;
};

// The page row shows 3 / 4 / 5 squares depending on width; extra tiles are hidden with CSS.
const ROW_VISIBILITY = ["", "", "", "hidden sm:block", "hidden lg:block"];

const arrow = (d: string) => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function Viewer({ photos, start, labels, onBack }: { photos: PhotoItem[]; start: number; labels: Labels; onBack: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const reduce = useReducedMotion();

  // The dialog may still be hidden (zero width) on first render, so position the track once it has a size,
  // and keep the current photo aligned when the size changes (e.g. rotating an iPad).
  const indexRef = useRef(start);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let width = 0;
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || el.clientWidth === width) return;
      width = el.clientWidth;
      el.scrollLeft = indexRef.current * width;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  const goRef = useRef(goTo);
  useEffect(() => {
    goRef.current = goTo;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goRef.current(index + 1);
      if (e.key === "ArrowLeft") goRef.current(index - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index]);

  const current = photos[index];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 bg-black">
        <div ref={track} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
          {photos.map((p, i) => (
            <div key={p.src} className="relative h-full w-full shrink-0 snap-center snap-always">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.caption || `${labels.photo} ${i + 1}`}
                loading={Math.abs(i - start) <= 1 || Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                draggable={false}
                className="absolute inset-0 m-auto max-h-full max-w-full select-none object-contain"
              />
            </div>
          ))}
        </div>
        {index > 0 && (
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={labels.previous}
            className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black sm:grid"
          >
            {arrow("M10 3L5 8l5 5")}
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={labels.next}
            className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black sm:grid"
          >
            {arrow("M6 3l5 5-5 5")}
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 border-t border-rule px-4 py-3">
        <button type="button" onClick={onBack} className="flex shrink-0 items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-sm transition-colors hover:border-ink">
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {labels.backToGrid}
        </button>
        <p className="min-w-0 flex-1 truncate text-sm text-muted">{current?.caption}</p>
        <span className="tabular shrink-0 text-sm text-muted" aria-live="polite">
          {index + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}

export function Photos({ photos, labels }: { photos: PhotoItem[]; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const gridScroll = useRef(0);

  const openAt = (i: number | null) => {
    setSelected(i);
    setOpen(true);
  };

  // Coming back from a photo returns to the same spot in the grid.
  useLayoutEffect(() => {
    if (open && selected === null && grid.current) grid.current.scrollTop = gridScroll.current;
  }, [open, selected]);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {photos.slice(0, 5).map((p, i) => (
          <li key={p.src} className={ROW_VISIBILITY[i]}>
            <button
              type="button"
              onClick={() => openAt(i)}
              aria-label={p.caption || `${labels.photo} ${i + 1}`}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-wash"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt=""
                loading="lazy"
                className="size-full object-cover grayscale transition duration-700 ease-out-quint group-hover:scale-[1.04] group-hover:grayscale-0"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="tabular text-sm text-muted">
          {photos.length} {labels.photosCount}
        </p>
        <button
          type="button"
          onClick={() => openAt(null)}
          className="rounded-full border border-ink px-5 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
        >
          {labels.seeAll}
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} label={labels.title} closeLabel={labels.close} size="xl">
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-rule pl-5 pr-16">
            <h3 className="font-display text-2xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
              {labels.title}
            </h3>
            <span className="tabular text-sm text-muted">
              {photos.length} {labels.photosCount}
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {selected === null ? (
              <motion.div
                key="grid"
                ref={grid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <ul className="grid grid-cols-3 gap-0.5 sm:gap-1 md:grid-cols-4 xl:grid-cols-5">
                  {photos.map((p, i) => (
                    <li key={p.src}>
                      <button
                        type="button"
                        onClick={() => {
                          gridScroll.current = grid.current?.scrollTop ?? 0;
                          setSelected(i);
                        }}
                        aria-label={p.caption || `${labels.photo} ${i + 1}`}
                        className="group relative block aspect-square w-full overflow-hidden bg-wash"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                        <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-0 flex-1"
              >
                <Viewer photos={photos} start={selected} labels={labels} onBack={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </>
  );
}
