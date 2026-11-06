"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { logout, saveResume } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { formatPeriod, tr } from "@/lib/i18n";
import {
  galleryKinds,
  resumeSchema,
  appFrames,
  type App,
  type AppFrame,
  type Education,
  type Experience,
  type GalleryItem,
  type GalleryKind,
  type Link,
  type Resume,
  type SectionKey,
  type SkillGroup,
  type SpokenLanguage,
} from "@/lib/schema";
import { FileField, LocalizedField, ScreensField, LocalizedLines, SelectField, TagsField, TextField, Toggle } from "./fields";
import { ListEditor } from "./list-editor";
import { ResumePdf } from "./resume-pdf";

const tabs = [
  { key: "profile", label: "Profile" },
  { key: "experience", label: "Experience" },
  { key: "apps", label: "Apps" },
  { key: "gallery", label: "Certificates" },
  { key: "photos", label: "Photos" },
  { key: "skills", label: "Skills & languages" },
  { key: "education", label: "Education" },
  { key: "links", label: "Links" },
  { key: "sections", label: "Visibility" },
  { key: "backup", label: "Backup" },
] as const;
type Tab = (typeof tabs)[number]["key"];

const sectionLabels: Record<SectionKey, string> = {
  about: "About",
  experience: "Experience",
  apps: "Apps",
  gallery: "Certificates & activities",
  photos: "Gallery (photos)",
  skills: "Skills & languages",
  education: "Education",
  contact: "Contact",
};

const kindLabels: Record<GalleryKind, string> = {
  certificate: "Certificate",
  training: "Training",
  competition: "Competition",
  activity: "Activity",
};

const frameLabels: Record<AppFrame, string> = {
  auto: "Auto",
  phone: "Phone",
  tablet: "Tablet",
  browser: "Browser window",
  none: "No frame",
};

const empty = () => ({ en: "", th: "" });
const label = (v: { en: string; th: string }) => tr(v, "en");

type Status = { kind: "idle" } | { kind: "saved"; at: string } | { kind: "error"; message: string };

export function Editor({ initial, storage }: { initial: Resume; storage: string }) {
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("profile");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [pdfOpen, setPdfOpen] = useState(false);

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    startTransition(async () => {
      const res = await saveResume(data);
      if (res.ok) {
        setData(res.data);
        setSaved(JSON.stringify(res.data));
        setStatus({ kind: "saved", at: new Date().toLocaleTimeString() });
      } else {
        setStatus({ kind: "error", message: res.error });
      }
    });

  // Cmd/Ctrl+S publishes.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const patch = <K extends keyof Resume>(key: K, value: Resume[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setStatus((s) => (s.kind === "idle" ? s : { kind: "idle" }));
  };
  const profile = (p: Partial<Resume["profile"]>) => patch("profile", { ...data.profile, ...p });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
          <span className="font-display text-lg font-bold tracking-tight">Resume admin</span>
          <span className="hidden rounded-full border border-rule px-2 py-0.5 text-xs text-muted sm:inline" title="Where your data is stored">
            {{ redis: "Redis", blob: "Vercel Blob", file: "Local file" }[storage] ?? storage}
          </span>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={status.kind + (dirty ? "d" : "")}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="hidden text-sm text-muted md:inline"
              >
                {status.kind === "error" ? "Not published" : dirty ? "Unpublished changes" : status.kind === "saved" ? `Published at ${status.at}` : "All changes published"}
              </motion.span>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-rule px-3 py-2 text-sm transition-colors hover:border-ink"
              title="Build a one-page A4 resume and save it as PDF"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="M4 1.5h5.5L12.5 4.5v10h-8.5zM9.5 1.5v3h3M8 7v5M5.8 9.8L8 12l2.2-2.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              Export PDF
            </button>
            <a href="/en" target="_blank" className="rounded-md px-2 py-2 text-sm text-muted transition-colors hover:text-ink">
              View EN
            </a>
            <a href="/th" target="_blank" className="rounded-md px-2 py-2 text-sm text-muted transition-colors hover:text-ink">
              TH
            </a>
            <ThemeToggle />
            <button
              onClick={save}
              disabled={pending || !dirty}
              className="ml-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
            >
              {pending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {pdfOpen && <ResumePdf data={data} onClose={() => setPdfOpen(false)} />}

      <AnimatePresence>
        {status.kind === "error" && (
          <motion.div role="alert" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-ink text-paper">
            <p className="mx-auto max-w-6xl px-4 py-3 text-sm md:px-8">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[12rem_1fr] md:px-8 md:py-12">
        <nav aria-label="Editor sections" className="md:sticky md:top-28 md:self-start">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-col md:overflow-visible">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setTab(t.key)}
                  aria-current={tab === t.key ? "page" : undefined}
                  className="relative whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors md:w-full"
                >
                  {tab === t.key && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-md bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span className={`relative ${tab === t.key ? "text-paper" : "text-muted hover:text-ink"}`}>{t.label}</span>
                </button>
              </li>
            ))}
            <li className="md:mt-6">
              <form action={logout}>
                <button className="whitespace-nowrap px-3 py-2 text-sm text-muted transition-colors hover:text-ink">Sign out</button>
              </form>
            </li>
          </ul>
        </nav>

        <AnimatePresence mode="wait">
          <motion.main
            key={tab + formKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="min-w-0"
          >
            {tab === "profile" && (
              <Panel title="Profile" description="Your name, photo and introduction. Fill in English and Thai; an empty language falls back to the other one.">
                <div className="grid gap-5">
                  <FileField label="Profile photo" hint="Shown in black and white next to About. Square or portrait works best." aspect="aspect-[4/5]" value={data.profile.photo} onChange={(photo) => profile({ photo })} />
                  <LocalizedField label="Name" value={data.profile.name} onChange={(name) => profile({ name })} />
                  <LocalizedField label="Headline" value={data.profile.headline} onChange={(headline) => profile({ headline })} />
                  <LocalizedField label="Location" value={data.profile.location} onChange={(location) => profile({ location })} />
                  <LocalizedField label="About" hint="Leave a blank line between paragraphs." multiline rows={8} value={data.profile.summary} onChange={(summary) => profile({ summary })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Email" type="email" value={data.profile.email} onChange={(email) => profile({ email })} />
                    <TextField label="Phone" hint="Shown publicly in Contact. Leave empty to hide." value={data.profile.phone} onChange={(phone) => profile({ phone })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileField label="Resume PDF (English)" accept="pdf" value={data.profile.resumeFile.en} onChange={(en) => profile({ resumeFile: { ...data.profile.resumeFile, en } })} />
                    <FileField label="Resume PDF (Thai)" accept="pdf" value={data.profile.resumeFile.th} onChange={(th) => profile({ resumeFile: { ...data.profile.resumeFile, th } })} />
                  </div>
                  <div className="divide-y divide-rule border-y border-rule">
                    <Toggle label="Available for work" hint="Shows a pulsing dot next to the status text" checked={data.profile.available} onChange={(available) => profile({ available })} />
                  </div>
                  <LocalizedField label="Status text" value={data.profile.availabilityText} onChange={(availabilityText) => profile({ availabilityText })} />
                  <LocalizedLines label="Hobbies" hint="One per line. Shown at the end of About." rows={5} value={data.profile.hobbies} onChange={(hobbies) => profile({ hobbies })} />
                </div>
              </Panel>
            )}

            {tab === "experience" && (
              <Panel title="Experience" description="Newest first. Leave the end date empty for your current role.">
                <ListEditor<Experience>
                  items={data.experience}
                  onChange={(v) => patch("experience", v)}
                  create={() => ({ role: empty(), company: empty(), location: empty(), start: "", end: "", description: empty(), highlights: { en: [], th: [] } })}
                  addLabel="Add a role"
                  emptyText="No roles yet. Add your most recent one."
                  title={(e) => [label(e.role), label(e.company)].filter(Boolean).join(" at ")}
                  subtitle={(e) => formatPeriod(e.start, e.end, "en")}
                >
                  {(e, set) => (
                    <>
                      <LocalizedField className="sm:col-span-2" label="Role" value={e.role} onChange={(role) => set({ role })} />
                      <LocalizedField className="sm:col-span-2" label="Company" value={e.company} onChange={(company) => set({ company })} />
                      <TextField label="Start" placeholder="2023-01" hint="YYYY-MM or YYYY" value={e.start} onChange={(start) => set({ start })} />
                      <TextField label="End" placeholder="Empty = present" value={e.end} onChange={(end) => set({ end })} />
                      <LocalizedField className="sm:col-span-2" label="Location" hint="Optional" value={e.location} onChange={(location) => set({ location })} />
                      <LocalizedField className="sm:col-span-2" label="Description" hint="Optional short intro above the highlights" multiline rows={3} value={e.description} onChange={(description) => set({ description })} />
                      <LocalizedLines className="sm:col-span-2" label="Highlights" hint="One per line" rows={6} value={e.highlights} onChange={(highlights) => set({ highlights })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "apps" && (
              <Panel title="Apps" description="Apps you've built. Visitors see a card for each; selecting it opens the screenshots.">
                <ListEditor<App>
                  items={data.apps}
                  onChange={(v) => patch("apps", v)}
                  create={() => ({ name: "", year: "", platform: "", tagline: empty(), description: empty(), tags: [], url: "", repoUrl: "", icon: "", frame: "auto", screenshots: [] })}
                  addLabel="Add an app"
                  emptyText="No apps yet."
                  title={(a) => a.name}
                  subtitle={(a) => [a.platform, a.year, a.screenshots.length ? `${a.screenshots.length} screens` : ""].filter(Boolean).join(", ")}
                >
                  {(a, set) => (
                    <>
                      <TextField label="Name" value={a.name} onChange={(name) => set({ name })} />
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="Platform" placeholder="iOS, Android, Web" value={a.platform} onChange={(platform) => set({ platform })} />
                        <TextField label="Year" value={a.year} onChange={(year) => set({ year })} />
                      </div>
                      <LocalizedField className="sm:col-span-2" label="One-line summary" value={a.tagline} onChange={(tagline) => set({ tagline })} />
                      <LocalizedField className="sm:col-span-2" label="Description" multiline rows={4} value={a.description} onChange={(description) => set({ description })} />
                      <TagsField className="sm:col-span-2" label="Built with" hint="Separate with commas" value={a.tags} onChange={(tags) => set({ tags })} />
                      <TextField label="App link" placeholder="App Store, Play Store or website" value={a.url} onChange={(url) => set({ url })} />
                      <TextField label="Source code link" placeholder="https://github.com/…" value={a.repoUrl} onChange={(repoUrl) => set({ repoUrl })} />
                      <FileField label="App icon" hint="Square image" aspect="aspect-square" value={a.icon} onChange={(icon) => set({ icon })} />
                      <SelectField<AppFrame>
                        label="Screenshot frame"
                        hint="Auto: phone frame for tall screens, browser frame for wide ones"
                        value={a.frame}
                        onChange={(frame) => set({ frame })}
                        options={appFrames.map((f) => ({ value: f, label: frameLabels[f] }))}
                      />
                      <ScreensField className="sm:col-span-2" label="Screenshots / mockups" hint="Visitors swipe through these in order. Drag rows to reorder; the first one is the card image." value={a.screenshots} onChange={(screenshots) => set({ screenshots })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "gallery" && (
              <Panel title="Certificates & activities" description="Certificates, training, competitions and event photos. Upload a scan or photo, and optionally the original PDF.">
                <ListEditor<GalleryItem>
                  items={data.gallery}
                  onChange={(v) => patch("gallery", v)}
                  create={() => ({ kind: "certificate", title: empty(), issuer: empty(), date: "", image: "", file: "", url: "" })}
                  addLabel="Add a certificate or activity"
                  emptyText="Nothing here yet."
                  title={(g) => label(g.title)}
                  subtitle={(g) => [kindLabels[g.kind], g.date, g.image ? "has image" : "no image"].filter(Boolean).join(", ")}
                >
                  {(g, set) => (
                    <>
                      <SelectField<GalleryKind> label="Type" value={g.kind} onChange={(kind) => set({ kind })} options={galleryKinds.map((k) => ({ value: k, label: kindLabels[k] }))} />
                      <TextField label="Date" placeholder="2024-05" hint="YYYY-MM or YYYY" value={g.date} onChange={(date) => set({ date })} />
                      <LocalizedField className="sm:col-span-2" label="Title" value={g.title} onChange={(title) => set({ title })} />
                      <LocalizedField className="sm:col-span-2" label="Issued by / organizer" value={g.issuer} onChange={(issuer) => set({ issuer })} />
                      <FileField label="Image" hint="Certificate scan or event photo" value={g.image} onChange={(image) => set({ image })} />
                      <FileField label="Original file" hint="Optional PDF or full-size image" accept="image+pdf" value={g.file} onChange={(file) => set({ file })} />
                      <TextField className="sm:col-span-2" label="Verification link" hint="Optional, e.g. Credly" value={g.url} onChange={(url) => set({ url })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "photos" && (
              <Panel
                title="Photos"
                description="Event, work and travel photos for the Gallery section. The page shows the first row; visitors open the rest in a grid. Photos are cropped to squares in the grid and shown whole when opened."
              >
                <ScreensField
                  label={`${data.photos.length} photo${data.photos.length === 1 ? "" : "s"}`}
                  hint="Upload several at once. Drag rows to reorder; the first ones appear on the page."
                  noun="photo"
                  firstNote=""
                  value={data.photos}
                  onChange={(photos) => patch("photos", photos)}
                />
              </Panel>
            )}

            {tab === "skills" && (
              <Panel title="Skills & languages" description="Group related skills together. Skill names are the same in both languages.">
                <ListEditor<SkillGroup>
                  items={data.skills}
                  onChange={(v) => patch("skills", v)}
                  create={() => ({ group: empty(), items: [] })}
                  addLabel="Add a skill group"
                  emptyText="No skill groups yet."
                  title={(g) => label(g.group)}
                  subtitle={(g) => g.items.join(", ")}
                >
                  {(g, set) => (
                    <>
                      <LocalizedField className="sm:col-span-2" label="Group" value={g.group} onChange={(group) => set({ group })} />
                      <TagsField className="sm:col-span-2" label="Skills" hint="Separate with commas" value={g.items} onChange={(items) => set({ items })} />
                    </>
                  )}
                </ListEditor>

                <h2 className="mb-4 mt-12 font-display text-2xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
                  Languages you speak
                </h2>
                <ListEditor<SpokenLanguage>
                  items={data.spokenLanguages}
                  onChange={(v) => patch("spokenLanguages", v)}
                  create={() => ({ name: empty(), level: empty() })}
                  addLabel="Add a language"
                  emptyText="No languages yet."
                  title={(l) => label(l.name)}
                  subtitle={(l) => label(l.level)}
                >
                  {(l, set) => (
                    <>
                      <LocalizedField className="sm:col-span-2" label="Language" value={l.name} onChange={(name) => set({ name })} />
                      <LocalizedField className="sm:col-span-2" label="Level" value={l.level} onChange={(level) => set({ level })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "education" && (
              <Panel title="Education" description="Degrees and courses.">
                <ListEditor<Education>
                  items={data.education}
                  onChange={(v) => patch("education", v)}
                  create={() => ({ school: empty(), degree: empty(), start: "", end: "", note: empty() })}
                  addLabel="Add education"
                  emptyText="Nothing here yet."
                  title={(e) => label(e.school)}
                  subtitle={(e) => [label(e.degree), formatPeriod(e.start, e.end, "en")].filter(Boolean).join(", ")}
                >
                  {(e, set) => (
                    <>
                      <LocalizedField className="sm:col-span-2" label="School" value={e.school} onChange={(school) => set({ school })} />
                      <LocalizedField className="sm:col-span-2" label="Degree or course" value={e.degree} onChange={(degree) => set({ degree })} />
                      <TextField label="Start" placeholder="2014" value={e.start} onChange={(start) => set({ start })} />
                      <TextField label="End" placeholder="2018" value={e.end} onChange={(end) => set({ end })} />
                      <LocalizedField className="sm:col-span-2" label="Note" multiline rows={2} value={e.note} onChange={(note) => set({ note })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "links" && (
              <Panel title="Links" description="Profiles shown under your name and in Contact. Labels are the same in both languages.">
                <ListEditor<Link>
                  items={data.links}
                  onChange={(v) => patch("links", v)}
                  create={() => ({ label: "", url: "" })}
                  addLabel="Add a link"
                  emptyText="No links yet."
                  title={(l) => l.label}
                  subtitle={(l) => l.url}
                >
                  {(l, set) => (
                    <>
                      <TextField label="Label" placeholder="LinkedIn" value={l.label} onChange={(v) => set({ label: v })} />
                      <TextField label="URL" placeholder="https://" value={l.url} onChange={(url) => set({ url })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "sections" && (
              <Panel title="Visibility" description="Hide a section without deleting its content. Empty sections are hidden automatically.">
                <div className="divide-y divide-rule border-y border-rule">
                  {(Object.keys(sectionLabels) as SectionKey[]).map((k) => (
                    <Toggle key={k} label={sectionLabels[k]} checked={data.sections[k]} onChange={(v) => patch("sections", { ...data.sections, [k]: v })} />
                  ))}
                </div>
              </Panel>
            )}

            {tab === "backup" && (
              <Backup
                data={data}
                onImport={(next) => {
                  setData(next);
                  setFormKey((k) => k + 1);
                  setStatus({ kind: "idle" });
                }}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="font-display text-3xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
        {title}
      </h1>
      <p className="mb-8 mt-1 max-w-[70ch] text-muted">{description}</p>
      {children}
    </section>
  );
}

function Backup({ data, onImport }: { data: Resume; onImport: (d: Resume) => void }) {
  const [error, setError] = useState("");

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `resume-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File) => {
    setError("");
    try {
      const parsed = resumeSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) {
        const i = parsed.error.issues[0];
        return setError(`This file doesn't match the resume format (${i.path.join(" › ")}: ${i.message}).`);
      }
      onImport(parsed.data);
    } catch {
      setError("This file isn't valid JSON.");
    }
  };

  return (
    <Panel title="Backup" description="Download all text as one JSON file, or load a file to replace what's in the editor. Uploaded images stay in storage and are referenced by link.">
      <div className="flex flex-wrap gap-3">
        <button onClick={download} className="rounded-md border border-ink px-4 py-2 text-sm font-medium">
          Download JSON
        </button>
        <label className="cursor-pointer rounded-md border border-rule px-4 py-2 text-sm transition-colors hover:border-ink">
          Load from file
          <input type="file" accept="application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <p className="mt-4 text-sm text-muted">Loading a file only changes the editor. Press Publish to make it live.</p>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          {error}
        </p>
      )}
    </Panel>
  );
}
