"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Modal } from "./modal";

export type GalleryCard = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  issuer: string;
  date: string;
  image: string;
  file: string;
  url: string;
};

type Labels = { all: string; close: string; viewFile: string; verify: string };

export function Gallery({ items, kinds, labels }: { items: GalleryCard[]; kinds: { key: string; label: string }[]; labels: Labels }) {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.kind === filter)), [items, filter]);
  const usedKinds = kinds.filter((k) => items.some((i) => i.kind === k.key));
  const open = items.find((i) => i.id === openId) ?? null;

  return (
    <>
      {usedKinds.length > 1 && (
        <div role="group" className="mb-8 flex flex-wrap gap-2">
          {[{ key: "all", label: labels.all }, ...usedKinds].map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setFilter(k.key)}
              aria-pressed={filter === k.key}
              className="relative rounded-full border border-rule px-3.5 py-1.5 text-sm transition-colors hover:border-ink"
            >
              {filter === k.key && <motion.span layoutId="gallery-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className={`relative ${filter === k.key ? "text-paper" : ""}`}>{k.label}</span>
            </button>
          ))}
        </div>
      )}

      <motion.ul layout className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => {
            const clickable = Boolean(item.image || item.file || item.url);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => setOpenId(item.id)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-rule text-left transition-colors duration-500 enabled:hover:border-ink disabled:cursor-default"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-wash">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition duration-700 ease-out-quint group-hover:scale-[1.03]"
                      />
                    ) : (
                      // No scan yet: a quiet seal instead of repeating the title.
                      <svg viewBox="0 0 48 48" aria-hidden className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-ink/25 transition-transform duration-700 ease-out-quint group-hover:rotate-12">
                        <circle cx="24" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="24" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M17 29l-4 13 7-3 4 6 3-11M31 29l4 13-7-3-4 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="text-xs text-muted">
                      {item.kindLabel}
                      {item.date && <span className="tabular">, {item.date}</span>}
                    </p>
                    <h3 className="text-sm font-medium leading-snug sm:text-base">{item.title}</h3>
                    {item.issuer && <p className="text-xs text-muted sm:text-sm">{item.issuer}</p>}
                  </div>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      <Modal open={Boolean(open)} onClose={() => setOpenId(null)} label={open?.title ?? ""} closeLabel={labels.close} size={open?.image ? "lg" : "md"}>
        {open && (
          <div>
            {open.image && (
              <div className="flex max-h-[70dvh] items-center justify-center bg-wash p-4 sm:p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={open.image} alt={open.title} className="max-h-[calc(70dvh-3rem)] w-auto max-w-full object-contain" />
              </div>
            )}
            <div className="p-6 pr-14">
              <p className="text-sm text-muted">
                {open.kindLabel}
                {open.date && <span className="tabular">, {open.date}</span>}
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 85' }}>
                {open.title}
              </h3>
              {open.issuer && <p className="text-muted">{open.issuer}</p>}
              {(open.file || open.url) && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {open.file && (
                    <a href={open.file} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
                      {labels.viewFile}
                    </a>
                  )}
                  {open.url && (
                    <a href={open.url} target="_blank" rel="noreferrer" className="rounded-full border border-ink px-5 py-2.5 text-sm font-medium">
                      {labels.verify}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
