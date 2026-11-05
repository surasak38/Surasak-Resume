import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Section } from "@/components/site/section";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Timeline } from "@/components/site/timeline";
import { formatPeriod, hostOf } from "@/lib/format";
import { getResume } from "@/lib/resume";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getResume();
  return {
    title: { absolute: `${profile.name} — ${profile.headline || "Resume"}` },
    description: profile.summary.split("\n")[0] || profile.headline,
  };
}

export default async function Home() {
  const data = await getResume();
  const { profile, sections } = data;

  const nav = [
    sections.about && profile.summary && { href: "#about", label: "About" },
    sections.experience && data.experience.length > 0 && { href: "#experience", label: "Experience" },
    sections.projects && data.projects.length > 0 && { href: "#projects", label: "Projects" },
    sections.skills && data.skills.length > 0 && { href: "#skills", label: "Skills" },
    sections.contact && { href: "#contact", label: "Contact" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <a href="#top" className="font-display text-lg font-bold tracking-tight">
            {profile.name.split(" ")[0]}
          </a>
          <nav aria-label="Sections" className="flex items-center gap-6 text-sm">
            <ul className="hidden gap-6 sm:flex">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-muted transition-colors hover:text-ink">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4 md:px-8">
        <Hero profile={profile} links={data.links} />

        {sections.about && profile.summary && (
          <Section id="about" title="About">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-[60ch] space-y-5 text-lg leading-relaxed md:text-xl">
                {profile.summary.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {profile.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- any host is allowed from the admin panel
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="aspect-[4/5] w-48 object-cover grayscale transition duration-700 ease-out-quint hover:grayscale-0 lg:w-56"
                />
              )}
            </div>
          </Section>
        )}

        {sections.experience && data.experience.length > 0 && (
          <Section id="experience" title="Experience">
            <Timeline items={data.experience} />
          </Section>
        )}

        {sections.projects && data.projects.length > 0 && (
          <Section id="projects" title="Projects">
            <ul className="border-t border-ink">
              {data.projects.map((p) => {
                const Row = p.url ? "a" : "div";
                return (
                  <li key={p.id} className="border-b border-rule">
                    <Row
                      {...(p.url ? { href: p.url, target: "_blank", rel: "noreferrer" } : {})}
                      className="group relative isolate grid gap-3 px-3 py-7 transition-colors duration-500 ease-out-quint before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink before:transition-transform before:duration-500 before:ease-out-quint hover:text-paper hover:before:scale-y-100 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-10"
                    >
                      <div>
                        <div className="flex items-baseline gap-4">
                          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl" style={{ fontVariationSettings: '"wdth" 80' }}>
                            {p.name}
                          </h3>
                          {p.year && <span className="tabular text-sm opacity-60">{p.year}</span>}
                        </div>
                        {p.url && <p className="mt-1 text-sm opacity-60">{hostOf(p.url)}</p>}
                      </div>
                      <div className="space-y-3">
                        {p.description && <p className="leading-relaxed">{p.description}</p>}
                        {p.tags.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {p.tags.map((t) => (
                              <li key={t} className="rounded-full border border-current px-2.5 py-0.5 text-xs opacity-70">
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Row>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {sections.skills && data.skills.length > 0 && (
          <Section id="skills" title="Skills">
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {data.skills.map((g) => (
                <div key={g.id}>
                  <dt className="text-sm text-muted">{g.group}</dt>
                  <dd className="mt-2 text-xl leading-snug">{g.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {sections.education && data.education.length > 0 && (
          <Section id="education" title="Education">
            <ul className="space-y-8">
              {data.education.map((e) => (
                <li key={e.id} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <h3 className="text-xl font-medium">{e.school}</h3>
                    {e.degree && <p>{e.degree}</p>}
                    {e.note && <p className="mt-2 max-w-[60ch] text-muted">{e.note}</p>}
                  </div>
                  <p className="tabular text-sm text-muted sm:text-right">{formatPeriod(e.start, e.end)}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {sections.contact && (
          <Section id="contact" title="Contact">
            <p className="max-w-[40ch] text-lg text-muted">The fastest way to reach me is by email.</p>
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
              {profile.phone && <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a>}
              {profile.resumeUrl && (
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  Download resume (PDF)
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
        <span>© {profile.name}</span>
        {data.updatedAt && (
          <span className="tabular">
            Updated {new Date(data.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
        </div>
      </footer>
    </>
  );
}
