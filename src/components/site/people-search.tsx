"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { suggestPeople } from "@/app/search-actions";
import type { ProfileCard } from "@/lib/profiles";

type Lang = "en" | "th";
type Labels = { label: string; placeholder: string; search: string; suggestions: string; noMatch: string; seeAll: string; viewsWord: string };

const pick = (v: { en: string; th: string }, lang: Lang) => v[lang] || v[lang === "en" ? "th" : "en"];

/** Bolds the first case-insensitive match of `q` in `text`. */
function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Search box with live suggestions: up to five people as you type.
 * Arrow keys move through them, Enter opens one, and Enter with none chosen runs the full search.
 */
export function PeopleSearch({ initial, lang, labels }: { initial: string; lang: Lang; labels: Labels }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [value, setValue] = useState(initial);
  const [results, setResults] = useState<{ q: string; people: ProfileCard[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef("");

  const q = value.trim();

  // Ask for suggestions a moment after typing stops; drop answers to older queries.
  useEffect(() => {
    latest.current = q;
    if (!q) return;
    const timer = setTimeout(async () => {
      try {
        const people = await suggestPeople(q);
        if (latest.current === q) setResults({ q, people });
      } catch {
        if (latest.current === q) setResults({ q, people: [] });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  // Close when clicking anywhere else.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const people = results && q ? results.people : [];
  const settled = results?.q === q;
  const show = open && q.length > 0 && (people.length > 0 || settled);
  // One extra row at the end runs the full search.
  const rows = people.length + 1;

  const go = (handle: string) => {
    setOpen(false);
    router.push(`/${handle}/profile?lang=${lang}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!q) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % rows : (i - 1 + rows) % rows));
    } else if (e.key === "Escape") {
      if (show) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    } else if (e.key === "Enter" && show && active >= 0 && active < people.length) {
      e.preventDefault();
      go(people[active].handle);
    }
  };

  return (
    <form action="/#people" method="get" role="search" className="mt-6 flex max-w-2xl gap-2">
      <input type="hidden" name="lang" value={lang} />
      <div ref={box} className="relative min-w-0 flex-1">
        <label htmlFor={`${id}-q`} className="sr-only">
          {labels.label}
        </label>
        <input
          id={`${id}-q`}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={labels.placeholder}
          className="w-full rounded-full border border-rule bg-paper px-5 py-3 outline-none transition-colors focus:border-ink"
        />
        {show && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-ink bg-paper shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
            <ul id={listId} role="listbox" aria-label={labels.suggestions}>
              {people.map((p, i) => {
                const name = pick(p.name, lang) || p.handle;
                const headline = pick(p.headline, lang);
                return (
                  <li
                    key={p.handle}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={active === i}
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => go(p.handle)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${active === i ? "bg-wash" : ""}`}
                  >
                    <span className="size-10 shrink-0 overflow-hidden rounded-md bg-wash">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center bg-ink font-display font-bold text-paper">{name.charAt(0).toUpperCase() || "?"}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        <Mark text={name} q={q} />
                      </span>
                      <span className="block truncate text-xs text-muted">
                        /<Mark text={p.handle} q={q} />
                        {headline && <>, {headline}</>}
                      </span>
                    </span>
                    {p.views ? (
                      <span className="shrink-0 text-xs tabular-nums text-muted" aria-label={`${p.views} ${labels.viewsWord}`}>
                        {p.views.toLocaleString("en-US")} {labels.viewsWord}
                      </span>
                    ) : null}
                  </li>
                );
              })}
              {people.length === 0 && settled && <li className="px-4 py-3 text-sm text-muted">{labels.noMatch}</li>}
              <li
                id={`${id}-opt-${people.length}`}
                role="option"
                aria-selected={active === people.length}
                onPointerEnter={() => setActive(people.length)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  router.push(`/?lang=${lang}&q=${encodeURIComponent(q)}#people`);
                }}
                className={`cursor-pointer border-t border-rule px-4 py-2.5 text-sm transition-colors ${active === people.length ? "bg-wash" : ""}`}
              >
                {labels.seeAll.replace("{q}", q)}
              </li>
            </ul>
          </div>
        )}
      </div>
      <button className="rounded-full bg-ink px-6 py-3 font-medium text-paper">{labels.search}</button>
    </form>
  );
}
