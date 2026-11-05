"use client";

import { useId, useState } from "react";

const inputCls =
  "mt-1.5 block w-full rounded-md border border-rule bg-paper px-3 py-2 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink";

type Base = { label: string; hint?: string; className?: string };

function Shell({ label, hint, className, id, children }: Base & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
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

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  ...base
}: Base & { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const id = useId();
  return (
    <Shell id={id} {...base}>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y leading-relaxed`} />
    </Shell>
  );
}

/** Edits a string[] as raw text; `separator` is "\n" (one per line) or "," (comma list). */
export function ListField({
  value,
  onChange,
  separator,
  rows = 3,
  placeholder,
  ...base
}: Base & { value: string[]; onChange: (v: string[]) => void; separator: "\n" | ","; rows?: number; placeholder?: string }) {
  const id = useId();
  const [raw, setRaw] = useState(() => value.join(separator === "," ? ", " : "\n"));
  const update = (text: string) => {
    setRaw(text);
    onChange(text.split(separator).map((s) => s.trim()).filter(Boolean));
  };
  return (
    <Shell id={id} {...base}>
      {separator === "," ? (
        <input id={id} value={raw} placeholder={placeholder} onChange={(e) => update(e.target.value)} className={inputCls} />
      ) : (
        <textarea id={id} rows={rows} value={raw} placeholder={placeholder} onChange={(e) => update(e.target.value)} className={`${inputCls} resize-y leading-relaxed`} />
      )}
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
