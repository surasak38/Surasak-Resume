import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Apps } from "@/components/site/apps";
import { Gallery } from "@/components/site/gallery";
import { Hero } from "@/components/site/hero";
import { Section } from "@/components/site/section";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Timeline } from "@/components/site/timeline";
import { dict, formatPeriod, formatPoint, isLocale, tr, trList, type Locale } from "@/lib/i18n";
import { getResume } from "@/lib/resume";
import { galleryKinds } from "@/lib/schema";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { profile } = await getResume();
  const name = tr(profile.name, lang);
  const headline = tr(profile.headline, lang);
  return {
    title: headline ? `${name} — ${headline}` : name,
    description: tr(profile.summary, lang).split("\n")[0] || headline,
    alternates: { languages: { en: "/en", th: "/th" } },
    openGraph: { title: name, description: headline, locale: lang === "th" ? "th_TH" : "en_US", type: "profile" },
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang: Locale = raw;
  const t = dict[lang];
  const other: Locale = lang === "en" ? "th" : "en";

  const data = await getResume();
  const { profile, sections } = data;
  const name = tr(profile.name, lang);
  const altName = profile.name[other] && profile.name[other] !== name ? profile.name[other] : "";
  const summary = tr(profile.summary, lang);
  const resumeFile = profile.resumeFile[lang] || profile.resumeFile[other];

  const show = {
    about: sections.about && Boolean(summary || profile.photo),
    experience: sections.experience && data.experience.length > 0,
    apps: sections.apps && data.apps.length > 0,
    gallery: sections.gallery && data.gallery.length > 0,
    skills: sections.skills && (data.skills.length > 0 || data.spokenLanguages.length > 0),
    education: sections.education && data.education.length > 0,
    contact: sections.contact,
  };

  const nav = (
    [
      ["about", "#about"],
      ["experience", "#experience"],
      ["apps", "#apps"],
      ["gallery", "#gallery"],
      ["skills", "#skills"],
      ["contact", "#contact"],
    ] as const
  ).filter(([key]) => show[key]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        {lang === "th" ? "ข้ามไปเนื้อหา" : "Skip to content"}
      </a>
      <header className="fixed inset-x-0 top-0 z-40 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <a href="#top" className="truncate font-display text-lg font-bold tracking-tight">
            {name.split(" ")[0]}
          </a>
          <nav aria-label={lang === "th" ? "ส่วนต่างๆ" : "Sections"} className="flex items-center gap-5 text-sm">
            <ul className="hidden gap-5 lg:flex">
              {nav.map(([key, href]) => (
                <li key={key}>
                  <a href={href} className="text-muted transition-colors hover:text-ink">
                    {t.nav[key]}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href={`/${other}`}
              hrefLang={other}
              lang={other}
              className="grid h-9 min-w-9 place-items-center rounded-full border border-rule px-2.5 text-xs font-medium transition-colors hover:border-ink"
              aria-label={t.switchTo}
            >
              {t.switchToShort}
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4 md:px-8">
        <Hero
          nameLines={name.split(/\s+/).filter(Boolean)}
          altName={altName}
          headline={tr(profile.headline, lang)}
          location={tr(profile.location, lang)}
          available={profile.available}
          availabilityText={tr(profile.availabilityText, lang)}
          links={data.links}
        />

        <div id="main" />

        {show.about && (
          <Section id="about" title={t.about}>
            <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-[60ch] space-y-5 text-lg leading-relaxed md:text-xl">
                {summary.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {profile.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo}
                  alt={name}
                  className="aspect-[4/5] w-48 rounded-sm object-cover grayscale transition duration-700 ease-out-quint hover:grayscale-0 lg:w-60"
                />
              )}
            </div>
          </Section>
        )}

        {show.experience && (
          <Section id="experience" title={t.experience}>
            <Timeline
              items={data.experience.map((e) => ({
                id: e.id,
                period: formatPeriod(e.start, e.end, lang),
                location: tr(e.location, lang),
                role: tr(e.role, lang),
                company: tr(e.company, lang),
                description: tr(e.description, lang),
                highlights: trList(e.highlights, lang),
              }))}
            />
          </Section>
        )}

        {show.apps && (
          <Section id="apps" title={t.apps}>
            <p className="-mt-1 mb-8 text-muted">{t.appsIntro}</p>
            <Apps
              apps={data.apps.map((a) => ({
                id: a.id,
                name: a.name,
                year: a.year,
                platform: a.platform,
                tagline: tr(a.tagline, lang),
                description: tr(a.description, lang),
                tags: a.tags,
                url: a.url,
                repoUrl: a.repoUrl,
                icon: a.icon,
                screenshots: a.screenshots,
              }))}
              labels={{ visit: t.visit, source: t.source, close: t.close, previous: t.previous, next: t.next, screen: t.screen }}
            />
          </Section>
        )}

        {show.gallery && (
          <Section id="gallery" title={t.gallery}>
            <Gallery
              items={data.gallery.map((g) => ({
                id: g.id,
                kind: g.kind,
                kindLabel: t.kind[g.kind],
                title: tr(g.title, lang),
                issuer: tr(g.issuer, lang),
                date: formatPoint(g.date, lang),
                image: g.image,
                file: g.file,
                url: g.url,
              }))}
              kinds={galleryKinds.map((k) => ({ key: k, label: t.kinds[k] }))}
              labels={{ all: t.all, close: t.close, viewFile: t.viewFile, verify: t.verify }}
            />
          </Section>
        )}

        {show.skills && (
          <Section id="skills" title={t.skills}>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {data.skills.map((g) => (
                <div key={g.id}>
                  <dt className="text-sm text-muted">{tr(g.group, lang)}</dt>
                  <dd className="mt-2 text-lg leading-snug md:text-xl">{g.items.join(", ")}</dd>
                </div>
              ))}
              {data.spokenLanguages.length > 0 && (
                <div>
                  <dt className="text-sm text-muted">{t.languages}</dt>
                  <dd className="mt-2 space-y-1 text-lg leading-snug md:text-xl">
                    {data.spokenLanguages.map((l) => (
                      <p key={l.id}>
                        {tr(l.name, lang)}
                        {tr(l.level, lang) && <span className="text-base text-muted">, {tr(l.level, lang)}</span>}
                      </p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Section>
        )}

        {show.education && (
          <Section id="education" title={t.education}>
            <ul className="space-y-8">
              {data.education.map((e) => (
                <li key={e.id} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <h3 className="text-xl font-medium">{tr(e.school, lang)}</h3>
                    {tr(e.degree, lang) && <p>{tr(e.degree, lang)}</p>}
                    {tr(e.note, lang) && <p className="mt-2 max-w-[60ch] text-muted">{tr(e.note, lang)}</p>}
                  </div>
                  <p className="tabular text-sm text-muted sm:text-right">{formatPeriod(e.start, e.end, lang)}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {show.contact && (
          <Section id="contact" title={t.contact}>
            <p className="max-w-[40ch] text-lg text-muted">{t.contactIntro}</p>
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="group mt-6 inline-block break-all font-display font-semibold leading-none tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 6vw, 4.5rem)", fontVariationSettings: '"wdth" 80' }}
              >
                {profile.email}
                <span className="mt-2 block h-[3px] origin-left scale-x-[0.15] bg-ink transition-transform duration-700 ease-out-quint group-hover:scale-x-100" />
              </a>
            )}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {profile.phone && (
                <a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`} className="tabular">
                  {profile.phone}
                </a>
              )}
              {resumeFile && (
                <a href={resumeFile} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {t.downloadResume}
                </a>
              )}
              {data.links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-ink">
                  {l.label}
                </a>
              ))}
            </div>
          </Section>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-wrap justify-between gap-2 border-t border-rule py-8 text-xs text-muted">
          <span>© {name}</span>
          {data.updatedAt && (
            <span className="tabular">
              {t.updated}{" "}
              {new Date(data.updatedAt).toLocaleDateString(lang === "th" ? "th-TH-u-ca-gregory" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </footer>
    </>
  );
}
