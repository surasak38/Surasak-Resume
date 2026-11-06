"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { setQueryParams, useQueryParam } from "@/lib/use-query-param";
import { DocViewer, isPdf } from "./doc-viewer";
import { Modal } from "./modal";

export type GalleryCard = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  issuer: string;
  date: string;
  /** The certificate itself: a PDF or an image. Empty when there's nothing to open. */
  doc: string;
  url: string;
};

type Labels = {
  all: string;
  close: string;
  verify: string;
  rotateLeft: string;
  rotateRight: string;
  openOriginal: string;
  failed: string;
  pdf: string;
  image: string;
};

function Icon({ pdf }: { pdf: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
      {pdf ? (
        <>
          <path d="M5 2.5h7l3.5 3.5v11.5h-10.5z M12 2.5v3.5h3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M7.5 10h5M7.5 12.5h5M7.5 15h3" stroke="currentColor" strokeWidth="1.3" />
        </>
      ) : (
        <>
          <rect x="2.5" y="4" width="15" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7" cy="8.5" r="1.4" fill="currentColor" />
          <path d="M3 15l4.5-4.5 3 3 2.5-2.5 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

const rotateIcon = (dir: 1 | -1) => (
  <svg viewBox="0 0 20 20" className="size-4" aria-hidden style={dir === -1 ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M15.5 9.5a5.5 5.5 0 1 1-1.8-4.1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14.5 2.5v3.5H11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const toolBtn = "grid size-9 place-items-center rounded-full border border-rule bg-paper transition-colors hover:border-ink";

export function Gallery({ items, kinds, labels }: { items: GalleryCard[]; kinds: { key: string; label: string }[]; labels: Labels }) {
  // ?certs=<kind> filters the list; ?cert=<id> opens one document; ?rot=90|180|270 turns it.
  const [filterParam, setFilterParam] = useQueryParam("certs");
  const filter = filterParam ?? "all";
  const [openId] = useQueryParam("cert");
  const [rotParam, setRot] = useQueryParam("rot");
  const rotation = ((Number(rotParam) || 0) % 360 + 360) % 360;

  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.kind === filter)), [items, filter]);
  const usedKinds = kinds.filter((k) => items.some((i) => i.kind === k.key));
  const open = items.find((i) => i.id === openId && i.doc) ?? null;

  const turn = (dir: 1 | -1) => setRot(String((rotation + dir * 90 + 360) % 360 || "") || null);
  const close = () => setQueryParams({ cert: null, rot: null });

  return (
    <>
      {usedKinds.length > 1 && (
        <div role="group" className="mb-6 flex flex-wrap gap-2">
          {[{ key: "all", label: labels.all }, ...usedKinds].map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setFilterParam(k.key === "all" ? null : k.key)}
              aria-pressed={filter === k.key}
              className="relative rounded-full border border-rule px-3.5 py-1.5 text-sm transition-colors hover:border-ink"
            >
              {filter === k.key && <motion.span layoutId="gallery-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className={`relative ${filter === k.key ? "text-paper" : ""}`}>{k.label}</span>
            </button>
          ))}
        </div>
      )}

      <ul className="grid border-t border-rule sm:grid-cols-2 sm:gap-x-8">
        {visible.map((item) => {
          const meta = [item.kindLabel, item.issuer, item.date].filter(Boolean).join(", ");
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{item.title}</span>
                {meta && <span className="mt-0.5 block text-sm text-muted">{meta}</span>}
              </span>
              {item.doc && (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted transition-colors group-hover:text-ink">
                  <Icon pdf={isPdf(item.doc)} />
                  {isPdf(item.doc) ? labels.pdf : labels.image}
                </span>
              )}
            </>
          );
          return (
            <li key={item.id} className="border-b border-rule">
              {item.doc ? (
                <button
                  type="button"
                  onClick={() => {
                    setQueryParams({ cert: item.id, rot: null }, { push: true });
                  }}
                  className="group flex w-full items-start gap-4 py-4 text-left"
                >
                  {body}
                </button>
              ) : (
                <div className="flex items-start gap-4 py-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <Modal open={Boolean(open)} onClose={close} label={open?.title ?? ""} closeLabel={labels.close} size="xl">
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-rule py-3 pl-5 pr-16">
              <div className="min-w-0 flex-1 max-sm:basis-full">
                <h3 className="truncate font-display text-xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 85' }}>
                  {open.title}
                </h3>
                <p className="truncate text-xs text-muted">{[open.kindLabel, open.issuer, open.date].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => turn(-1)} aria-label={labels.rotateLeft} title={labels.rotateLeft} className={toolBtn}>
                  {rotateIcon(-1)}
                </button>
                <button type="button" onClick={() => turn(1)} aria-label={labels.rotateRight} title={labels.rotateRight} className={toolBtn}>
                  {rotateIcon(1)}
                </button>
                <a href={open.doc} target="_blank" rel="noreferrer" className="rounded-full border border-rule px-3.5 py-2 text-sm transition-colors hover:border-ink">
                  {labels.openOriginal}
                </a>
                {open.url && (
                  <a href={open.url} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-paper">
                    {labels.verify}
                  </a>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-wash">
              <DocViewer key={open.doc} src={open.doc} title={open.title} rotation={rotation} failedLabel={labels.failed} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
