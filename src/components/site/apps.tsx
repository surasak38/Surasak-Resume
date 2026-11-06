"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { AppFrame } from "@/lib/schema";
import { Modal } from "./modal";

export type AppCard = {
  id: string;
  name: string;
  year: string;
  platform: string;
  tagline: string;
  description: string;
  tags: string[];
  url: string;
  repoUrl: string;
  icon: string;
  frame: AppFrame;
  screenshots: { src: string; caption: string }[];
};

type Labels = {
  visit: string;
  source: string;
  close: string;
  previous: string;
  next: string;
  screen: string;
  swipeHint: string;
  noScreens: string;
};

function Monogram({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`grid place-items-center bg-ink font-display font-bold text-paper ${className}`} style={{ fontVariationSettings: '"wdth" 75' }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function AppIcon({ app, className }: { app: AppCard; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return app.icon ? <img src={app.icon} alt="" className={`object-cover ${className}`} /> : <Monogram name={app.name} className={className} />;
}

const FRAMES: Record<Exclude<AppFrame, "auto">, string> = {
  phone: "rounded-[2rem] border-[8px] border-ink",
  tablet: "rounded-[1.5rem] border-[12px] border-ink",
  browser: "rounded-lg border-[5px] border-t-[22px] border-ink",
  none: "rounded-md",
};

const arrow = (d: string) => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/** Native scroll-snap slideshow: swipe on touch, two-finger scroll on trackpads, arrows and keys elsewhere. */
function Slideshow({ app, labels }: { app: AppCard; labels: Labels }) {
  const shots = app.screenshots;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [portrait, setPortrait] = useState<Record<number, boolean>>({});
  const reduce = useReducedMotion();

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
    if (!el || !shots.length) return;
    const n = (i + shots.length) % shots.length;
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

  if (!shots.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted">
        <AppIcon app={app} className="size-28 rounded-[1.8rem] text-5xl" />
        <p className="text-sm">{labels.noScreens}</p>
      </div>
    );
  }

  const frameFor = (i: number) => FRAMES[app.frame === "auto" ? (portrait[i] === false ? "browser" : "phone") : app.frame];

  return (
    <div className="flex h-full min-h-0 flex-col" role="region" aria-roledescription="carousel" aria-label={`${app.name}. ${labels.swipeHint}`}>
      <div className="relative min-h-0 flex-1">
        <div ref={track} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
          {shots.map((s, i) => (
            <figure
              key={s.src}
              aria-roledescription="slide"
              aria-label={`${labels.screen} ${i + 1} / ${shots.length}`}
              className="flex h-full w-full shrink-0 snap-center snap-always flex-col items-center gap-4 px-5 pb-4 pt-6 sm:px-16 sm:pt-10"
            >
              <div className="relative min-h-0 w-full flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.caption || `${app.name}, ${labels.screen} ${i + 1}`}
                  loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                    setPortrait((p) => ({ ...p, [i]: h >= w }));
                  }}
                  className={`absolute inset-0 m-auto block max-h-full max-w-full select-none bg-paper object-contain shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] ${frameFor(i)}`}
                />
              </div>
              {s.caption && <figcaption className="max-w-[60ch] text-center text-sm leading-snug text-muted">{s.caption}</figcaption>}
            </figure>
          ))}
        </div>

        {shots.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={labels.previous}
              className="absolute left-3 top-1/2 hidden size-11 sm:grid -translate-y-1/2 place-items-center rounded-full border border-rule bg-paper/90 backdrop-blur transition-colors hover:border-ink"
            >
              {arrow("M10 3L5 8l5 5")}
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={labels.next}
              className="absolute right-3 top-1/2 hidden size-11 sm:grid -translate-y-1/2 place-items-center rounded-full border border-rule bg-paper/90 backdrop-blur transition-colors hover:border-ink"
            >
              {arrow("M6 3l5 5-5 5")}
            </button>
          </>
        )}
      </div>

      {shots.length > 1 && (
        <div className="flex items-center gap-4 border-t border-rule px-4 py-3">
          <ol className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {shots.map((s, i) => (
              <li key={s.src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${labels.screen} ${i + 1}`}
                  aria-current={i === index}
                  className={`block h-14 w-14 overflow-hidden rounded-md border-2 transition-all duration-300 ${i === index ? "border-ink" : "border-transparent opacity-45 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" className="size-full object-cover object-top" />
                </button>
              </li>
            ))}
          </ol>
          <span className="tabular shrink-0 text-sm text-muted" aria-live="polite">
            {index + 1} / {shots.length}
          </span>
        </div>
      )}
    </div>
  );
}

export function Apps({ apps, labels }: { apps: AppCard[]; labels: Labels }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const app = apps.find((a) => a.id === openId) ?? null;

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2">
        {apps.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setOpenId(a.id)}
              className="group block w-full overflow-hidden rounded-2xl border border-rule text-left transition-colors duration-500 hover:border-ink"
            >
              <div className="relative flex aspect-[4/3] items-end justify-center overflow-hidden bg-wash px-8 pt-8">
                {a.screenshots[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.screenshots[0].src}
                    alt=""
                    loading="lazy"
                    className="max-h-full w-auto max-w-full rounded-t-xl border-x-[5px] border-t-[5px] border-ink object-cover object-top transition-transform duration-700 ease-out-quint group-hover:-translate-y-2"
                  />
                ) : (
                  <AppIcon app={a} className="mb-[18%] size-20 rounded-[1.4rem] text-4xl transition-transform duration-700 ease-out-quint group-hover:-translate-y-2" />
                )}
                {a.screenshots.length > 1 && (
                  <span className="tabular absolute right-3 top-3 rounded-full bg-paper px-2 py-0.5 text-xs">+{a.screenshots.length - 1}</span>
                )}
              </div>
              <div className="flex items-start gap-3 border-t border-rule p-4">
                <AppIcon app={a} className="size-10 shrink-0 rounded-xl text-lg" />
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold leading-tight tracking-tight" style={{ fontVariationSettings: '"wdth" 85' }}>
                    {a.name}
                  </h3>
                  <p className="text-sm text-muted">{[a.platform, a.year].filter(Boolean).join(", ")}</p>
                  {a.tagline && <p className="mt-2 leading-snug">{a.tagline}</p>}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(app)} onClose={() => setOpenId(null)} label={app?.name ?? ""} closeLabel={labels.close} size="xl">
        {app && (
          <div className="flex h-full flex-col md:flex-row">
            <div className="min-h-0 flex-1 bg-wash max-md:basis-[68%]">
              <Slideshow key={app.id} app={app} labels={labels} />
            </div>

            <aside className="overflow-y-auto border-rule p-6 max-md:flex-1 max-md:border-t md:w-[22rem] md:shrink-0 md:border-l md:p-8 lg:w-[26rem]">
              <div className="flex items-center gap-3 pr-10">
                <AppIcon app={app} className="size-12 shrink-0 rounded-2xl text-xl" />
                <div>
                  <h3 className="font-display text-3xl font-bold leading-none tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
                    {app.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{[app.platform, app.year].filter(Boolean).join(", ")}</p>
                </div>
              </div>
              {app.tagline && <p className="mt-6 text-lg leading-snug">{app.tagline}</p>}
              {app.description && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{app.description}</p>}
              {app.tags.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {app.tags.map((t) => (
                    <li key={t} className="rounded-full border border-rule px-2.5 py-0.5 text-xs">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                {app.url && (
                  <a href={app.url} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
                    {labels.visit}
                  </a>
                )}
                {app.repoUrl && (
                  <a href={app.repoUrl} target="_blank" rel="noreferrer" className="rounded-full border border-ink px-5 py-2.5 text-sm font-medium">
                    {labels.source}
                  </a>
                )}
              </div>
            </aside>
          </div>
        )}
      </Modal>
    </>
  );
}
