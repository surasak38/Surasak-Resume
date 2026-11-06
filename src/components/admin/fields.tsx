"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Localized, LocalizedList } from "@/lib/i18n";
import { uploadFile, useUploadOwner } from "./upload";

const inputCls =
  "block w-full rounded-md border border-rule bg-paper px-3 py-2 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink";

type Base = { label: string; hint?: string; className?: string };

function Shell({ label, hint, className, id, children }: Base & { id?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      {id ? (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <p className="text-sm font-medium">{label}</p>
      )}
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  ...base
}: Base & { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const id = useId();
  return (
    <Shell id={id} {...base}>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Shell>
  );
}

function LangTag({ lang }: { lang: "en" | "th" }) {
  return (
    <span aria-hidden className="pointer-events-none absolute left-2 top-2 rounded bg-wash px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
      {lang.toUpperCase()}
    </span>
  );
}

/** One field, two languages. */
export function LocalizedField({
  value,
  onChange,
  multiline = false,
  rows = 4,
  ...base
}: Base & { value: Localized; onChange: (v: Localized) => void; multiline?: boolean; rows?: number }) {
  const id = useId();
  return (
    <Shell {...base}>
      <div className={`grid gap-2 ${multiline ? "md:grid-cols-2" : ""}`}>
        {(["en", "th"] as const).map((lang) => (
          <div key={lang} className="relative">
            <LangTag lang={lang} />
            {multiline ? (
              <textarea
                id={`${id}-${lang}`}
                aria-label={`${base.label} (${lang === "en" ? "English" : "Thai"})`}
                lang={lang}
                rows={rows}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${inputCls} resize-y pl-11 leading-relaxed`}
              />
            ) : (
              <input
                id={`${id}-${lang}`}
                aria-label={`${base.label} (${lang === "en" ? "English" : "Thai"})`}
                lang={lang}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${inputCls} pl-11`}
              />
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}

function linesOf(text: string) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

/** A list of lines per language, edited as one line per item. */
export function LocalizedLines({ value, onChange, rows = 5, ...base }: Base & { value: LocalizedList; onChange: (v: LocalizedList) => void; rows?: number }) {
  const [raw, setRaw] = useState(() => ({ en: value.en.join("\n"), th: value.th.join("\n") }));
  return (
    <Shell {...base}>
      <div className="grid gap-2 md:grid-cols-2">
        {(["en", "th"] as const).map((lang) => (
          <div key={lang} className="relative">
            <LangTag lang={lang} />
            <textarea
              aria-label={`${base.label} (${lang === "en" ? "English" : "Thai"})`}
              lang={lang}
              rows={rows}
              value={raw[lang]}
              onChange={(e) => {
                setRaw({ ...raw, [lang]: e.target.value });
                onChange({ ...value, [lang]: linesOf(e.target.value) });
              }}
              className={`${inputCls} resize-y pl-11 leading-relaxed`}
            />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Edits a string[] as comma-separated text. */
export function TagsField({ value, onChange, placeholder, ...base }: Base & { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const id = useId();
  const [raw, setRaw] = useState(() => value.join(", "));
  return (
    <Shell id={id} {...base}>
      <input
        id={id}
        value={raw}
        placeholder={placeholder}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        className={inputCls}
      />
    </Shell>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  ...base
}: Base & { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <Shell id={id} {...base}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-ink transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:left-0.5 after:top-0.5 after:size-[18px] after:rounded-full after:bg-ink after:transition-transform after:duration-300 after:ease-out-quint peer-checked:after:translate-x-5 peer-checked:after:bg-paper"
      />
    </label>
  );
}

function useUploader(onDone: (urls: string[]) => void) {
  const owner = useUploadOwner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError("");
    const urls: string[] = [];
    try {
      for (const f of files) urls.push(await uploadFile(f, owner));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (urls.length) onDone(urls);
      setBusy(false);
    }
  };
  return { busy, error, run };
}

const btn = "rounded-md border border-rule px-3 py-1.5 text-sm transition-colors hover:border-ink disabled:opacity-50";

/** Single file: a photo, certificate scan or PDF. */
export function FileField({
  value,
  onChange,
  accept = "image",
  aspect = "aspect-[4/3]",
  ...base
}: Base & { value: string; onChange: (v: string) => void; accept?: "image" | "pdf" | "image+pdf"; aspect?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, run } = useUploader((urls) => onChange(urls[0]));
  const isPdf = value.endsWith(".pdf");
  const acceptAttr = { image: "image/jpeg,image/png,image/webp,image/gif", pdf: "application/pdf", "image+pdf": "image/jpeg,image/png,image/webp,image/gif,application/pdf" }[accept];

  return (
    <Shell {...base}>
      <div
        className="flex items-center gap-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          run(Array.from(e.dataTransfer.files).slice(0, 1));
        }}
      >
        <div className={`relative grid w-28 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-rule bg-wash ${accept === "pdf" ? "aspect-[3/4]" : aspect}`}>
          {value && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : value && isPdf ? (
            <span className="text-xs font-semibold">PDF</span>
          ) : (
            <span className="px-2 text-center text-[11px] text-muted">{busy ? "Uploading…" : "Drop a file"}</span>
          )}
          {busy && value && <span className="absolute inset-0 grid place-items-center bg-paper/70 text-xs">Uploading…</span>}
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={busy} onClick={() => input.current?.click()}>
              {value ? "Replace" : "Upload"}
            </button>
            {value && (
              <>
                <a href={value} target="_blank" rel="noreferrer" className={btn}>
                  Open
                </a>
                <button type="button" className={btn} disabled={busy} onClick={() => onChange("")}>
                  Remove
                </button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs">
              {error}
            </p>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={acceptAttr}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            run(Array.from(e.target.files ?? []).slice(0, 1));
            e.target.value = "";
          }}
        />
      </div>
    </Shell>
  );
}

type Screen = { src: string; caption: Localized };

/**
 * App screenshots: upload several at once, reorder by dragging (or with the arrow buttons on touch screens),
 * and give each one an optional caption in both languages.
 */
export function ScreensField({
  value,
  onChange,
  noun = "screen",
  firstNote = "Card image",
  ...base
}: Base & { value: Screen[]; onChange: (v: Screen[]) => void; noun?: string; firstNote?: string }) {
  const input = useRef<HTMLInputElement>(null);
  // Uploads finish later; append to whatever the list is by then.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  const { busy, error, run } = useUploader((urls) => onChange([...latest.current, ...urls.map((src) => ({ src, caption: { en: "", th: "" } }))]));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const moveTo = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const update = (i: number, patch: Partial<Screen>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <Shell {...base}>
      <div
        className="rounded-lg border border-dashed border-rule p-2"
        onDragOver={(e) => isFileDrag(e) && e.preventDefault()}
        onDrop={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          run(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
        }}
      >
        {value.length > 0 && (
          <ol className="space-y-2">
            {value.map((shot, i) => (
              <li
                key={shot.src}
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  moveTo(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                className={`flex gap-3 rounded-md border bg-paper p-2 transition-colors ${dragOver === i && dragFrom !== i ? "border-ink" : "border-rule"} ${dragFrom === i ? "opacity-40" : ""}`}
              >
                <div className="flex cursor-grab flex-col items-center justify-center gap-1 text-muted active:cursor-grabbing" title="Drag to reorder">
                  <svg viewBox="0 0 10 16" className="h-4 w-2.5" aria-hidden>
                    {[3, 8, 13].flatMap((y) => [2, 8].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="currentColor" />))}
                  </svg>
                  <span className="tabular text-[11px]">{i + 1}</span>
                </div>
                <a href={shot.src} target="_blank" rel="noreferrer" className="block h-28 w-20 shrink-0 overflow-hidden rounded border border-rule bg-wash" title="Open full size">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.src} alt={`${noun} ${i + 1}`} draggable={false} className="size-full object-cover object-top" />
                </a>
                <div className="grid min-w-0 flex-1 content-start gap-2">
                  {(["en", "th"] as const).map((lang) => (
                    <div key={lang} className="relative">
                      <LangTag lang={lang} />
                      <input
                        aria-label={`Caption for ${noun} ${i + 1} (${lang === "en" ? "English" : "Thai"})`}
                        lang={lang}
                        placeholder="Caption (optional)"
                        value={shot.caption[lang]}
                        onChange={(e) => update(i, { caption: { ...shot.caption, [lang]: e.target.value } })}
                        className={`${inputCls} pl-11 text-sm`}
                      />
                    </div>
                  ))}
                  {i === 0 && firstNote && <p className="text-xs text-muted">{firstNote}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveTo(i, i - 1)} className={`${btn} px-2`}>
                    ↑
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => moveTo(i, i + 1)} className={`${btn} px-2`}>
                    ↓
                  </button>
                  <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} className={`${btn} px-2`}>
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className={`w-full rounded-md py-4 text-sm text-muted transition-colors hover:text-ink ${value.length ? "mt-2" : ""}`}
        >
          {busy ? "Uploading…" : `+ Add ${noun}s (or drop images here)`}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs">
          {error}
        </p>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          run(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </Shell>
  );
}
