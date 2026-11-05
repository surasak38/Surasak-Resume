"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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
  screenshots: string[];
};

type Labels = { visit: string; source: string; close: string; previous: string; next: string; screen: string };

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

/** A screenshot shown inside a device-like frame; portrait shots get a phone frame. */
function Device({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  const [portrait, setPortrait] = useState<boolean | null>(null);
  return (
    <div
      className={`overflow-hidden border-ink bg-paper shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] ${
        portrait === false ? "w-full rounded-xl border-[6px]" : "h-full max-h-full rounded-[1.75rem] border-[7px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        onLoad={(e) => setPortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth)}
        className={portrait === false ? "block w-full" : "block h-full w-auto"}
      />
    </div>
  );
}

export function Apps({ apps, labels }: { apps: AppCard[]; labels: Labels }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const app = apps.find((a) => a.id === openId) ?? null;
  const shots = app?.screenshots ?? [];

  const open = (id: string) => {
    setIndex(0);
    setOpenId(id);
  };
  const go = (dir: number) => setIndex((i) => (i + dir + shots.length) % shots.length);

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2">
        {apps.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => open(a.id)}
              className="group block w-full overflow-hidden rounded-2xl border border-rule text-left transition-colors duration-500 hover:border-ink"
            >
              <div className="relative flex aspect-[4/3] items-end justify-center overflow-hidden bg-wash px-8 pt-8">
                {a.screenshots[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.screenshots[0]}
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

      <Modal open={Boolean(app)} onClose={() => setOpenId(null)} label={app?.name ?? ""} closeLabel={labels.close} wide>
        {app && (
          <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div
              className="relative flex flex-col bg-wash p-5 sm:p-8"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") go(1);
                if (e.key === "ArrowLeft") go(-1);
              }}
            >
              <div className="relative flex h-[52dvh] items-center justify-center md:h-[64dvh]">
                {shots.length > 0 ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full max-w-full items-center justify-center"
                    >
                      <Device src={shots[index]} alt={`${app.name}, ${labels.screen} ${index + 1}`} eager />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <AppIcon app={app} className="size-28 rounded-[1.8rem] text-5xl" />
                )}
              </div>
              {shots.length > 1 && (
                <div className="mt-5 flex items-center gap-3">
                  <button type="button" onClick={() => go(-1)} aria-label={labels.previous} className="grid size-9 shrink-0 place-items-center rounded-full border border-rule transition-colors hover:border-ink">
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
                  </button>
                  <ol className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
                    {shots.map((s, i) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setIndex(i)}
                          aria-label={`${labels.screen} ${i + 1}`}
                          aria-current={i === index}
                          className={`block h-14 w-10 overflow-hidden rounded-md border-2 transition-all ${i === index ? "border-ink" : "border-transparent opacity-50 hover:opacity-100"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s} alt="" loading="lazy" className="size-full object-cover object-top" />
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button type="button" onClick={() => go(1)} aria-label={labels.next} className="grid size-9 shrink-0 place-items-center rounded-full border border-rule transition-colors hover:border-ink">
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
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
              {app.description && <p className="mt-3 leading-relaxed text-muted">{app.description}</p>}
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
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
