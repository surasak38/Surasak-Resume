"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatPeriod, formatPoint, tr, trList, type Locale } from "@/lib/i18n";
import type { GalleryKind, Resume } from "@/lib/schema";

/**
 * One-page A4 resume built from the editor's current data (published or not),
 * exported through the browser's print dialog ("Save as PDF").
 */

const L = {
  en: {
    profile: "Profile",
    experience: "Experience",
    skills: "Skills",
    certificates: "Certifications & development",
    education: "Education",
    languages: "Languages",
    apps: "Personal projects",
    hobbies: "Interests",
    present: "Present",
    kinds: { certificate: "Credentials", training: "Training", competition: "Competitions", activity: "Activities" },
  },
  th: {
    profile: "สรุปประวัติวิชาชีพ",
    experience: "ประสบการณ์ทำงาน",
    skills: "ความเชี่ยวชาญทางเทคนิค",
    certificates: "ใบรับรองและการพัฒนาความรู้",
    education: "การศึกษา",
    languages: "ภาษา",
    apps: "โปรเจกต์ส่วนตัว",
    hobbies: "งานอดิเรก",
    present: "ปัจจุบัน",
    kinds: { certificate: "ใบรับรอง", training: "การอบรม", competition: "การแข่งขัน", activity: "กิจกรรม" },
  },
} as const;

type Part = "summary" | "experience" | "skills" | "certificates" | "education" | "languages" | "apps" | "hobbies" | "photo";

const partLabels: Record<Part, string> = {
  summary: "Profile summary",
  experience: "Experience",
  skills: "Skills",
  certificates: "Certificates & training",
  education: "Education",
  languages: "Languages",
  apps: "Apps",
  hobbies: "Hobbies",
  photo: "Photo",
};

const MIN_SCALE = 0.72;

const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Heading({ children }: { children: React.ReactNode }) {
  return (
    // Letter-spacing suits Latin capitals but pulls Thai vowels and tone marks away from their consonants.
    <h2 className="mb-[0.45em] mt-[1.05em] border-b border-black pb-[0.2em] font-display text-[calc(10.5pt*var(--s))] font-semibold uppercase tracking-[0.06em] [:lang(th)_&]:tracking-normal">
      {children}
    </h2>
  );
}

function Sheet({ data, lang, parts }: { data: Resume; lang: Locale; parts: Record<Part, boolean> }) {
  const t = L[lang];
  const p = data.profile;
  const other: Locale = lang === "en" ? "th" : "en";
  const name = tr(p.name, lang);
  const altName = p.name[other] && p.name[other] !== name ? p.name[other] : "";
  const contact = [tr(p.location, lang), p.phone, p.email].filter(Boolean);
  const kinds: GalleryKind[] = ["certificate", "training", "competition", "activity"];
  const hobbies = trList(p.hobbies, lang);

  return (
    <div lang={lang} className="text-[calc(9.3pt*var(--s))] leading-[1.42] text-black">
      <header className="flex items-start gap-[5mm]">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[calc(25pt*var(--s))] font-bold leading-[1.05] tracking-[-0.01em]" style={{ fontVariationSettings: '"wdth" 80' }}>
            {name}
            {altName && <span className="ml-[0.4em] text-[0.5em] font-medium tracking-normal text-neutral-500">{altName}</span>}
          </h1>
          {tr(p.headline, lang) && <p className="mt-[0.25em] text-[calc(11pt*var(--s))]">{tr(p.headline, lang)}</p>}
          <p className="mt-[0.4em] text-neutral-600">
            {contact.map((c, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-[0.5em] text-neutral-300">|</span>}
                {c.includes("@") ? <a href={`mailto:${c}`}>{c}</a> : c}
              </span>
            ))}
            {data.links.map((l) => (
              <span key={l.id}>
                <span className="mx-[0.5em] text-neutral-300">|</span>
                <a href={l.url}>{prettyUrl(l.url)}</a>
              </span>
            ))}
          </p>
        </div>
        {parts.photo && p.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt="" className="h-[30mm] w-[24mm] shrink-0 object-cover grayscale" />
        )}
      </header>

      {parts.summary && tr(p.summary, lang) && (
        <section>
          <Heading>{t.profile}</Heading>
          {tr(p.summary, lang)
            .split(/\n{2,}/)
            .map((para, i) => (
              <p key={i} className={i ? "mt-[0.35em]" : ""}>
                {para}
              </p>
            ))}
        </section>
      )}

      {parts.skills && data.skills.length > 0 && (
        <section>
          <Heading>{t.skills}</Heading>
          <ul>
            {data.skills.map((g) => (
              <li key={g.id}>
                <b className="font-semibold">{tr(g.group, lang)}:</b> {g.items.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {parts.experience && data.experience.length > 0 && (
        <section>
          <Heading>{t.experience}</Heading>
          <div className="space-y-[0.6em]">
            {data.experience.map((e) => {
              const bullets = trList(e.highlights, lang);
              const meta = [tr(e.company, lang), tr(e.location, lang)].filter(Boolean).join(", ");
              return (
                <article key={e.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-[4mm]">
                    <p>
                      <b className="font-semibold">{tr(e.role, lang)}</b>
                      {meta && <span className="text-neutral-700"> | {meta}</span>}
                    </p>
                    <span className="shrink-0 whitespace-nowrap text-neutral-600">{formatPeriod(e.start, e.end, lang)}</span>
                  </div>
                  {tr(e.description, lang) && <p className="text-neutral-700">{tr(e.description, lang)}</p>}
                  {bullets.length > 0 && (
                    <ul className="mt-[0.15em] space-y-[0.08em]">
                      {bullets.map((b, i) => (
                        <li key={i} className="relative pl-[1.1em] before:absolute before:left-[0.2em] before:top-[0.68em] before:size-[0.28em] before:rounded-full before:bg-black">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {parts.apps && data.apps.length > 0 && (
        <section>
          <Heading>{t.apps}</Heading>
          <ul>
            {data.apps.map((a) => (
              <li key={a.id}>
                <b className="font-semibold">{a.name}</b>
                {a.platform && <span className="text-neutral-600"> ({a.platform})</span>}
                {tr(a.tagline, lang) && <span>: {tr(a.tagline, lang)}</span>}
                {(a.url || a.repoUrl) && (
                  <span className="text-neutral-600">
                    {" "}
                    <a href={a.url || a.repoUrl}>{prettyUrl(a.url || a.repoUrl)}</a>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {parts.certificates && data.gallery.length > 0 && (
        <section>
          <Heading>{t.certificates}</Heading>
          <ul>
            {kinds.map((k) => {
              const items = data.gallery.filter((g) => g.kind === k);
              if (!items.length) return null;
              return (
                <li key={k}>
                  <b className="font-semibold">{t.kinds[k]}:</b>{" "}
                  {items
                    .map((g) => {
                      const title = tr(g.title, lang);
                      const when = formatPoint(g.date, lang);
                      return when && !title.includes(when) ? `${title} (${when})` : title;
                    })
                    .join("; ")}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(parts.education || parts.languages || parts.hobbies) && (
        <section>
          <Heading>{[parts.education && t.education, parts.languages && t.languages].filter(Boolean).join(lang === "th" ? "และ" : " & ") || t.hobbies}</Heading>
          {parts.education && (
            <ul>
              {data.education.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-[4mm]">
                  <span>
                    {[tr(e.degree, lang), tr(e.school, lang)].filter(Boolean).join(", ")}
                    {tr(e.note, lang) && <span className="text-neutral-600"> ({tr(e.note, lang)})</span>}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-neutral-600">{formatPeriod(e.start, e.end, lang)}</span>
                </li>
              ))}
            </ul>
          )}
          {parts.languages && data.spokenLanguages.length > 0 && (
            <p className={parts.education ? "mt-[0.3em]" : ""}>
              <b className="font-semibold">{t.languages}:</b>{" "}
              {data.spokenLanguages.map((l) => [tr(l.name, lang), tr(l.level, lang)].filter(Boolean).join(" – ")).join("; ")}
            </p>
          )}
          {parts.hobbies && hobbies.length > 0 && (
            <p className="mt-[0.3em]">
              <b className="font-semibold">{t.hobbies}:</b> {hobbies.join(", ")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export function ResumePdf({ data, onClose }: { data: Resume; onClose: () => void }) {
  const [lang, setLang] = useState<Locale>("en");
  const [parts, setParts] = useState<Record<Part, boolean>>({
    summary: true,
    experience: true,
    skills: true,
    certificates: true,
    education: true,
    languages: true,
    apps: false,
    hobbies: false,
    photo: false,
  });
  const [fit, setFit] = useState({ scale: 1, overflow: false });
  const [preview, setPreview] = useState(1);
  const sheet = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // Shrink type step by step until everything fits on one page.
  const refit = useCallback(() => {
    const el = sheet.current;
    if (!el) return;
    let s = 1;
    el.style.setProperty("--s", String(s));
    while (el.scrollHeight > el.clientHeight + 1 && s > MIN_SCALE) {
      s = Math.round((s - 0.02) * 100) / 100;
      el.style.setProperty("--s", String(s));
    }
    setFit({ scale: s, overflow: el.scrollHeight > el.clientHeight + 1 });
  }, []);

  useLayoutEffect(() => {
    refit();
    document.fonts?.ready.then(refit);
    // Photos load async and can change the header height.
    const imgs = Array.from(sheet.current?.querySelectorAll("img") ?? []);
    imgs.forEach((img) => img.complete || img.addEventListener("load", refit, { once: true }));
  }, [lang, parts, data, refit]);

  // Scale the on-screen preview to the available width; printing ignores this.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPreview(Math.min(1, (el.clientWidth - 32) / 794)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    document.documentElement.classList.add("printing-resume");
    return () => {
      removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("printing-resume");
    };
  }, [onClose]);

  const download = () => {
    const previous = document.title;
    const base = (tr(data.profile.name, "en") || "Resume").replace(/\s+/g, "_");
    document.title = `${base}_Resume_${lang.toUpperCase()}`;
    addEventListener("afterprint", () => (document.title = previous), { once: true });
    window.print();
  };

  const available: Record<Part, boolean> = {
    summary: Boolean(tr(data.profile.summary, lang)),
    experience: data.experience.length > 0,
    skills: data.skills.length > 0,
    certificates: data.gallery.length > 0,
    education: data.education.length > 0,
    languages: data.spokenLanguages.length > 0,
    apps: data.apps.length > 0,
    hobbies: trList(data.profile.hobbies, lang).length > 0,
    photo: Boolean(data.profile.photo),
  };
  const shown = Object.fromEntries((Object.keys(parts) as Part[]).map((k) => [k, parts[k] && available[k]])) as Record<Part, boolean>;

  // Rendered only after a click in the editor, so document is always available here.
  return createPortal(
    <div id="resume-print-root" className="fixed inset-0 z-50 flex flex-col bg-wash text-ink print:static print:block print:bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-rule bg-paper px-4 py-3 print:hidden md:px-6">
        <h2 className="font-display text-lg font-bold tracking-tight">One-page resume</h2>
        <div role="group" aria-label="Language" className="flex rounded-md border border-rule p-0.5">
          {(["en", "th"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded px-3 py-1 text-sm ${lang === l ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {l === "en" ? "English" : "ไทย"}
            </button>
          ))}
        </div>
        <span className={`text-sm ${fit.overflow ? "font-medium" : "text-muted"}`} aria-live="polite">
          {fit.overflow
            ? "Too long for one page even at the smallest size. Turn off a section or shorten some highlights."
            : fit.scale < 1
              ? `Fits on one page (text at ${Math.round(fit.scale * 100)}%)`
              : "Fits on one page"}
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-rule px-4 py-2 text-sm transition-colors hover:border-ink">
            Close
          </button>
          <button type="button" onClick={download} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper">
            Download PDF
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 print:block">
        <fieldset className="hidden w-56 shrink-0 overflow-y-auto border-r border-rule bg-paper p-4 print:hidden md:block">
          <legend className="sr-only">Sections to include</legend>
          <p className="mb-2 text-sm font-medium">Include</p>
          {(Object.keys(partLabels) as Part[]).map((k) => (
            <label key={k} className={`flex items-center gap-2 py-1.5 text-sm ${available[k] ? "cursor-pointer" : "text-muted/60"}`}>
              <input type="checkbox" disabled={!available[k]} checked={shown[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} className="size-4 accent-current" />
              {partLabels[k]}
            </label>
          ))}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Uses what&apos;s in the editor now, including unpublished changes. In the print dialog, choose &ldquo;Save as PDF&rdquo;.
          </p>
        </fieldset>

        <div ref={stage} className="min-w-0 flex-1 overflow-auto p-4 print:overflow-visible print:p-0">
          <div className="mx-auto print:m-0" style={{ width: 794 * preview, height: 1123 * preview }}>
            <div className="origin-top-left print:!transform-none" style={{ transform: `scale(${preview})` }}>
              <div ref={sheet} className="resume-sheet box-border h-[297mm] w-[210mm] overflow-hidden bg-white px-[15mm] py-[13mm] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] print:shadow-none">
                <Sheet data={data} lang={lang} parts={shown} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
