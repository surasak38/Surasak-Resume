"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { logout, saveResume } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { formatPeriod } from "@/lib/format";
import { resumeSchema, type Education, type Experience, type Link, type Project, type Resume, type SectionKey, type SkillGroup } from "@/lib/schema";
import { ListField, TextArea, TextField, Toggle } from "./fields";
import { ListEditor } from "./list-editor";

const tabs = [
  { key: "profile", label: "Profile" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "links", label: "Links" },
  { key: "sections", label: "Visibility" },
  { key: "backup", label: "Backup" },
] as const;
type Tab = (typeof tabs)[number]["key"];

const sectionLabels: Record<SectionKey, string> = {
  about: "About",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  contact: "Contact",
};

type Status = { kind: "idle" } | { kind: "saved"; at: string } | { kind: "error"; message: string };

export function Editor({ initial, storage }: { initial: Resume; storage: string }) {
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("profile");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

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

  // Cmd/Ctrl+S saves.
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
    if (status.kind !== "idle") setStatus({ kind: "idle" });
  };
  const profile = (p: Partial<Resume["profile"]>) => patch("profile", { ...data.profile, ...p });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
          <span className="font-display text-lg font-bold tracking-tight">Resume admin</span>
          <span className="hidden rounded-full border border-rule px-2 py-0.5 text-xs text-muted sm:inline" title="Where your data is stored">
            {storage === "redis" ? "Redis" : "Local file"}
          </span>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={status.kind + (dirty ? "d" : "")}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`hidden text-sm md:inline ${status.kind === "error" ? "" : "text-muted"}`}
              >
                {status.kind === "error" ? "Not saved" : dirty ? "Unsaved changes" : status.kind === "saved" ? `Published at ${status.at}` : "All changes published"}
              </motion.span>
            </AnimatePresence>
            <a href="/" target="_blank" className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink">
              View site
            </a>
            <ThemeToggle />
            <button
              onClick={save}
              disabled={pending || !dirty}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
            >
              {pending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {status.kind === "error" && (
          <motion.div
            role="alert"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-ink text-paper"
          >
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
                  {tab === t.key && (
                    <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-md bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                  )}
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
              <Panel title="Profile" description="Your name, headline and the short introduction at the top of the page.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Name" value={data.profile.name} onChange={(name) => profile({ name })} />
                  <TextField label="Name in Thai" hint="Shown under your name. Leave empty to hide." value={data.profile.nameLocal} onChange={(nameLocal) => profile({ nameLocal })} />
                  <TextField className="sm:col-span-2" label="Headline" value={data.profile.headline} onChange={(headline) => profile({ headline })} />
                  <TextField label="Location" value={data.profile.location} onChange={(location) => profile({ location })} />
                  <TextField label="Email" type="email" value={data.profile.email} onChange={(email) => profile({ email })} />
                  <TextField label="Phone" hint="Optional" value={data.profile.phone} onChange={(phone) => profile({ phone })} />
                  <TextField label="Photo URL" hint="Shown in black and white next to About" value={data.profile.avatarUrl} onChange={(avatarUrl) => profile({ avatarUrl })} />
                  <TextField className="sm:col-span-2" label="Resume PDF URL" hint="Adds a download link in Contact" value={data.profile.resumeUrl} onChange={(resumeUrl) => profile({ resumeUrl })} />
                  <TextArea className="sm:col-span-2" rows={7} label="About" hint="Leave a blank line between paragraphs." value={data.profile.summary} onChange={(summary) => profile({ summary })} />
                </div>
                <div className="mt-6 divide-y divide-rule border-y border-rule">
                  <Toggle label="Available for work" hint="Shows a pulsing dot next to the status text" checked={data.profile.available} onChange={(available) => profile({ available })} />
                </div>
                <TextField className="mt-4" label="Status text" value={data.profile.availabilityText} onChange={(availabilityText) => profile({ availabilityText })} />
              </Panel>
            )}

            {tab === "experience" && (
              <Panel title="Experience" description="Newest first. Leave the end date empty for your current role.">
                <ListEditor<Experience>
                  items={data.experience}
                  onChange={(v) => patch("experience", v)}
                  create={() => ({ role: "", company: "", location: "", start: "", end: "", description: "", highlights: [] })}
                  addLabel="Add a role"
                  emptyText="No roles yet. Add your most recent one."
                  title={(e) => [e.role, e.company].filter(Boolean).join(" at ")}
                  subtitle={(e) => formatPeriod(e.start, e.end)}
                >
                  {(e, set) => (
                    <>
                      <TextField label="Role" value={e.role} onChange={(role) => set({ role })} />
                      <TextField label="Company" value={e.company} onChange={(company) => set({ company })} />
                      <TextField label="Start" placeholder="2023-01" hint="YYYY-MM or YYYY" value={e.start} onChange={(start) => set({ start })} />
                      <TextField label="End" placeholder="Empty = present" value={e.end} onChange={(end) => set({ end })} />
                      <TextField className="sm:col-span-2" label="Location" value={e.location} onChange={(location) => set({ location })} />
                      <TextArea className="sm:col-span-2" rows={3} label="Description" value={e.description} onChange={(description) => set({ description })} />
                      <ListField className="sm:col-span-2" separator={"\n"} rows={4} label="Highlights" hint="One per line" value={e.highlights} onChange={(highlights) => set({ highlights })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "projects" && (
              <Panel title="Projects" description="Work you want people to look at. Rows link out when a URL is set.">
                <ListEditor<Project>
                  items={data.projects}
                  onChange={(v) => patch("projects", v)}
                  create={() => ({ name: "", year: "", url: "", description: "", tags: [] })}
                  addLabel="Add a project"
                  emptyText="No projects yet."
                  title={(p) => p.name}
                  subtitle={(p) => [p.year, p.tags.join(", ")].filter(Boolean).join("  ")}
                >
                  {(p, set) => (
                    <>
                      <TextField label="Name" value={p.name} onChange={(name) => set({ name })} />
                      <TextField label="Year" value={p.year} onChange={(year) => set({ year })} />
                      <TextField className="sm:col-span-2" label="URL" value={p.url} onChange={(url) => set({ url })} />
                      <TextArea className="sm:col-span-2" rows={3} label="Description" value={p.description} onChange={(description) => set({ description })} />
                      <ListField className="sm:col-span-2" separator="," label="Tags" hint="Separate with commas" value={p.tags} onChange={(tags) => set({ tags })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "skills" && (
              <Panel title="Skills" description="Group related skills together.">
                <ListEditor<SkillGroup>
                  items={data.skills}
                  onChange={(v) => patch("skills", v)}
                  create={() => ({ group: "", items: [] })}
                  addLabel="Add a group"
                  emptyText="No skill groups yet."
                  title={(g) => g.group}
                  subtitle={(g) => g.items.join(", ")}
                >
                  {(g, set) => (
                    <>
                      <TextField label="Group" value={g.group} onChange={(group) => set({ group })} />
                      <ListField separator="," label="Skills" hint="Separate with commas" value={g.items} onChange={(items) => set({ items })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "education" && (
              <Panel title="Education" description="Degrees, courses and certificates.">
                <ListEditor<Education>
                  items={data.education}
                  onChange={(v) => patch("education", v)}
                  create={() => ({ school: "", degree: "", start: "", end: "", note: "" })}
                  addLabel="Add education"
                  emptyText="Nothing here yet."
                  title={(e) => e.school}
                  subtitle={(e) => [e.degree, formatPeriod(e.start, e.end)].filter(Boolean).join("  ")}
                >
                  {(e, set) => (
                    <>
                      <TextField label="School" value={e.school} onChange={(school) => set({ school })} />
                      <TextField label="Degree" value={e.degree} onChange={(degree) => set({ degree })} />
                      <TextField label="Start" placeholder="2014" value={e.start} onChange={(start) => set({ start })} />
                      <TextField label="End" placeholder="2018" value={e.end} onChange={(end) => set({ end })} />
                      <TextArea className="sm:col-span-2" rows={2} label="Note" value={e.note} onChange={(note) => set({ note })} />
                    </>
                  )}
                </ListEditor>
              </Panel>
            )}

            {tab === "links" && (
              <Panel title="Links" description="Profiles shown in the header area and in Contact.">
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
                      <TextField label="Label" placeholder="GitHub" value={l.label} onChange={(label) => set({ label })} />
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
      <p className="mb-8 mt-1 text-muted">{description}</p>
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
    <Panel title="Backup" description="Download everything as one JSON file, or load a file to replace what's in the editor.">
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
