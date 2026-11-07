import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { PeopleSearch } from "@/components/site/people-search";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { pickLocale, tr, type Locale } from "@/lib/i18n";
import { getHandleFor, searchProfiles } from "@/lib/profiles";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/lib/supabase/server";

const EXAMPLE_HANDLE = process.env.LEGACY_HANDLE || "surasak.jrs";

const copy = {
  en: {
    title: `${SITE_NAME} — bilingual resumes`,
    headline: ["Your resume,", "in two languages."],
    intro: "One link for your work history, apps, certificates and photos, in English and Thai. Export a one-page A4 PDF whenever someone asks.",
    create: "Create your resume",
    example: "See an example",
    edit: "Edit my resume",
    signIn: "Sign in",
    features: [
      ["Two languages, one page", "Write each section in English and Thai. Visitors switch with one tap, and an empty language falls back to the other."],
      ["A one-page PDF", "Choose what goes in and export an A4 resume that fits on one page, ready to attach."],
      ["Show your work", "App screenshots in a swipeable viewer, certificates with scans, and a photo gallery."],
      ["Your own link", "Pick a short link like /your.name/profile. Change it whenever you like."],
    ],
    findTitle: "Find people",
    searchLabel: "Search by name, role or place",
    searchPlaceholder: "e.g. full-stack, Bangkok, Surasak",
    search: "Search",
    views: (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "view" : "views"}`,
    suggestions: "Suggested people",
    noMatch: "No one matches yet. Keep typing or try another word.",
    seeAll: "See all results for “{q}”",
    recent: "Recently updated",
    results: (n: number, q: string) => `${n} ${n === 1 ? "person" : "people"} matching “${q}”`,
    none: (q: string) => `No one matches “${q}”. Try a shorter word or a different spelling.`,
    empty: "No public resumes yet. Yours could be the first.",
    switchLabel: "ภาษาไทย",
    switchShort: "TH",
  },
  th: {
    title: `${SITE_NAME} — Resume สองภาษา`,
    headline: ["Resume ของคุณ", "ทั้งไทยและอังกฤษ"],
    intro: "ลิงก์เดียวรวมประวัติการทำงาน แอปที่พัฒนา ใบรับรอง และรูปภาพ ทั้งภาษาไทยและอังกฤษ พร้อม Export เป็น PDF ขนาด A4 หน้าเดียวได้ทันที",
    create: "สร้าง resume ของคุณ",
    example: "ดูตัวอย่าง",
    edit: "แก้ไข resume ของฉัน",
    signIn: "เข้าสู่ระบบ",
    features: [
      ["สองภาษาในหน้าเดียว", "เขียนแต่ละส่วนได้ทั้งไทยและอังกฤษ ผู้ชมสลับภาษาได้ในคลิกเดียว ถ้าภาษาไหนว่างจะแสดงอีกภาษาแทน"],
      ["PDF หน้าเดียว", "เลือกได้ว่าจะใส่อะไรบ้าง แล้ว Export เป็น resume ขนาด A4 ที่พอดีหนึ่งหน้า พร้อมแนบส่ง"],
      ["โชว์ผลงาน", "รูปหน้าจอแอปแบบปัดดูได้ ใบรับรองพร้อมไฟล์ และแกลเลอรีรูปภาพ"],
      ["ลิงก์ของคุณเอง", "ตั้งลิงก์สั้นๆ เช่น /your.name/profile และเปลี่ยนได้ทุกเมื่อ"],
    ],
    findTitle: "ค้นหาคน",
    searchLabel: "ค้นหาจากชื่อ ตำแหน่ง หรือสถานที่",
    searchPlaceholder: "เช่น full-stack, กรุงเทพ, สุรศักดิ์",
    search: "ค้นหา",
    views: (n: number) => `เข้าชม ${n.toLocaleString("en-US")} ครั้ง`,
    suggestions: "คนที่แนะนำ",
    noMatch: "ยังไม่พบคนที่ตรงกัน ลองพิมพ์ต่อหรือใช้คำอื่น",
    seeAll: "ดูผลการค้นหาทั้งหมดของ “{q}”",
    recent: "อัปเดตล่าสุด",
    results: (n: number, q: string) => `พบ ${n} คนที่ตรงกับ “${q}”`,
    none: (q: string) => `ไม่พบคนที่ตรงกับ “${q}” ลองใช้คำที่สั้นลงหรือสะกดแบบอื่น`,
    empty: "ยังไม่มี resume สาธารณะ คุณอาจเป็นคนแรก",
    switchLabel: "English",
    switchShort: "EN",
  },
} as const;

type Props = PageProps<"/">;

async function readParams(searchParams: Props["searchParams"]) {
  const sp = await searchParams;
  const lang = pickLocale(typeof sp.lang === "string" ? sp.lang : undefined, (await headers()).get("accept-language"));
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  return { lang, q };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang, q } = await readParams(searchParams);
  return {
    title: q ? `${q} — ${SITE_NAME}` : copy[lang].title,
    description: copy[lang].intro,
    alternates: { languages: { en: "/?lang=en", th: "/?lang=th" } },
  };
}

export default function Home(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Landing {...props} />
    </Suspense>
  );
}

async function AccountLinks({ lang }: { lang: Locale }) {
  const t = copy[lang];
  const user = await currentUser();
  const handle = user ? await getHandleFor(user.id) : null;
  if (handle) {
    return (
      <Link href={`/${handle}/admin`} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
        {t.edit}
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="hidden px-2 py-2 text-sm text-muted transition-colors hover:text-ink sm:inline">
        {t.signIn}
      </Link>
      <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
        {t.create}
      </Link>
    </>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Monogram({ name }: { name: string }) {
  return (
    <span className="grid size-full place-items-center bg-ink font-display text-2xl font-bold text-paper" style={{ fontVariationSettings: '"wdth" 75' }}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

async function Results({ q, lang }: { q: string; lang: Locale }) {
  const t = copy[lang];
  const people = await searchProfiles(q);
  return (
    <div className="mt-8">
      <p className="text-sm text-muted" aria-live="polite">
        {q ? (people.length ? t.results(people.length, q) : t.none(q)) : people.length ? t.recent : t.empty}
      </p>
      {people.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => {
            const name = tr(p.name, lang) || p.handle;
            return (
              <li key={p.handle}>
                <Link
                  href={`/${p.handle}/profile?lang=${lang}`}
                  className="group flex items-center gap-4 rounded-xl border border-rule p-3 transition-colors duration-300 hover:border-ink"
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-wash">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <Monogram name={name} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{name}</span>
                    {tr(p.headline, lang) && <span className="line-clamp-2 text-sm leading-snug text-muted">{tr(p.headline, lang)}</span>}
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      /{p.handle}
                      {tr(p.location, lang) && `, ${tr(p.location, lang)}`}
                    </span>
                    {p.views ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs tabular-nums text-muted">
                        <EyeIcon />
                        {t.views(p.views)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function Landing({ searchParams }: Props) {
  const { lang, q } = await readParams(searchParams);
  const t = copy[lang];
  const other: Locale = lang === "en" ? "th" : "en";

  return (
    <>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
        <Link href={`/?lang=${lang}`} className="font-display text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/?lang=${other}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            hrefLang={other}
            aria-label={t.switchLabel}
            className="grid h-9 min-w-9 place-items-center rounded-full border border-rule px-2.5 text-xs font-medium transition-colors hover:border-ink"
          >
            {t.switchShort}
          </Link>
          <ThemeToggle />
          <Suspense fallback={<span className="h-9 w-32" />}>
            <AccountLinks lang={lang} />
          </Suspense>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="pb-16 pt-16 md:pb-24 md:pt-24">
          <h1
            lang={lang}
            className={`font-display font-bold tracking-[-0.02em] ${lang === "th" ? "leading-[1.15]" : "leading-[0.9]"}`}
            style={{ fontSize: "clamp(3rem, 10vw, 8.5rem)", fontVariationSettings: '"wdth" 75, "opsz" 96' }}
          >
            {t.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="mt-10 grid gap-8 border-t border-ink pt-6 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-[46ch] text-lg leading-relaxed md:text-xl">{t.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-ink px-6 py-3 font-medium text-paper">
                {t.create}
              </Link>
              <Link href={`/${EXAMPLE_HANDLE}/profile?lang=${lang}`} className="rounded-full border border-ink px-6 py-3 font-medium">
                {t.example}
              </Link>
            </div>
          </div>
        </section>

        <section aria-label={t.features[0][0]} className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
          {t.features.map(([title, body]) => (
            <div key={title} className="bg-paper p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
                {title}
              </h2>
              <p className="mt-2 max-w-[48ch] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </section>

        <section id="people" aria-labelledby="people-title" className="scroll-mt-8 py-20 md:py-28">
          <h2 id="people-title" className="font-display text-4xl font-bold tracking-tight md:text-5xl" style={{ fontVariationSettings: '"wdth" 80' }}>
            {t.findTitle}
          </h2>
          <PeopleSearch
            key={q}
            initial={q}
            lang={lang}
            labels={{ label: t.searchLabel, placeholder: t.searchPlaceholder, search: t.search, suggestions: t.suggestions, noMatch: t.noMatch, seeAll: t.seeAll, viewsWord: lang === "th" ? "ครั้ง" : "views" }}
          />
          <Suspense fallback={<p className="mt-8 text-sm text-muted">…</p>}>
            <Results q={q} lang={lang} />
          </Suspense>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-wrap justify-between gap-2 border-t border-rule py-8 text-xs text-muted">
          <span>{SITE_NAME}</span>
          <Link href="/signup" className="hover:text-ink">
            {t.create}
          </Link>
        </div>
      </footer>
    </>
  );
}
