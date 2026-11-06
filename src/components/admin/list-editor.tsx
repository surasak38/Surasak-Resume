"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Props<T extends { id: string }> = {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => Omit<T, "id">;
  addLabel: string;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  children: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode;
  emptyText: string;
  /** Show the "include in one-page resume" toggle (items carry a boolean `pdf`). */
  pdfToggle?: boolean;
};

function PdfIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M4 1.5h5.5L12.5 4.5v10h-8.5zM9.5 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {on ? (
        <path d="M6 8h4.5M6 10.3h4.5M6 12.5h3" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" />
      )}
    </svg>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

const iconBtn =
  "grid size-8 place-items-center rounded-md border border-transparent text-muted transition-colors hover:border-rule hover:text-ink disabled:pointer-events-none disabled:opacity-30";

export function ListEditor<T extends { id: string }>({ items, onChange, create, addLabel, title, subtitle, children, emptyText, pdfToggle = false }: Props<T>) {
  const inPdf = (item: T) => (item as { pdf?: boolean }).pdf !== false;
  const set = (id: string, patch: Partial<T>) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    onChange(next);
  };
  const remove = (item: T) => {
    if (confirm(`Delete "${title(item) || "this item"}"?`)) onChange(items.filter((it) => it.id !== item.id));
  };
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const add = () => {
    const id = crypto.randomUUID();
    onChange([...items, { ...create(), id } as T]);
    setOpen((prev) => new Set(prev).add(id));
  };

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="rounded-lg border border-dashed border-rule p-8 text-center text-muted">{emptyText}</p>}
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            className={`overflow-hidden rounded-lg border bg-paper transition-colors ${open.has(item.id) ? "border-ink" : "border-rule"}`}
          >
            <div className="flex items-center gap-3 px-2 py-2 pl-4">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={open.has(item.id)}
                className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
              >
                <svg viewBox="0 0 16 16" className={`size-3 shrink-0 transition-transform duration-300 ${open.has(item.id) ? "rotate-90" : ""}`} aria-hidden>
                  <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{title(item) || "Untitled"}</span>
                  {(subtitle?.(item) || (pdfToggle && !inPdf(item))) && (
                    <span className="block truncate text-xs text-muted">
                      {pdfToggle && !inPdf(item) && <span className="mr-1.5 rounded border border-rule px-1 py-px text-[10px]">Not in PDF</span>}
                      {subtitle?.(item)}
                    </span>
                  )}
                </span>
              </button>
              <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className={iconBtn} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                ↓
              </button>
              {pdfToggle && (
                <button
                  type="button"
                  className={`${iconBtn} ${inPdf(item) ? "" : "!border-rule !text-ink"}`}
                  onClick={() => set(item.id, { pdf: !inPdf(item) } as unknown as Partial<T>)}
                  aria-pressed={!inPdf(item)}
                  aria-label={inPdf(item) ? "Included in one-page resume. Select to leave it out." : "Left out of one-page resume. Select to include it."}
                  title={inPdf(item) ? "In one-page resume" : "Not in one-page resume"}
                >
                  <PdfIcon on={inPdf(item)} />
                </button>
              )}
              <button type="button" className={iconBtn} onClick={() => remove(item)} aria-label="Delete">
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                  <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.5 8.5h5l.5-8.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {open.has(item.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <div className="grid gap-4 border-t border-rule px-4 py-5 sm:grid-cols-2">{children(item, (patch) => set(item.id, patch))}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-rule py-3 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
      >
        + {addLabel}
      </button>
    </div>
  );
}
