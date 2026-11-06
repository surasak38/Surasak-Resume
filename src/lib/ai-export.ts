import { formatPeriod, formatPoint, tr, trList, type Locale } from "./i18n";
import { resumeSchema, type Resume } from "./schema";

/* ------------------------------------------------------------------ Markdown */

const join = (parts: (string | false | undefined)[], sep = ", ") => parts.filter(Boolean).join(sep);

/** A readable resume in one language, for job forms, LinkedIn or as context for an AI. */
export function toMarkdown(data: Resume, lang: Locale): string {
  const p = data.profile;
  const out: string[] = [];
  const h = (title: string) => out.push("", `## ${title}`, "");
  const L = lang === "th"
    ? { summary: "สรุป", experience: "ประสบการณ์ทำงาน", apps: "แอปที่พัฒนา", certs: "ใบรับรองและกิจกรรม", skills: "ทักษะ", languages: "ภาษา", education: "การศึกษา", hobbies: "งานอดิเรก", links: "ลิงก์" }
    : { summary: "Summary", experience: "Experience", apps: "Apps", certs: "Certificates & activities", skills: "Skills", languages: "Languages", education: "Education", hobbies: "Interests", links: "Links" };

  out.push(`# ${tr(p.name, lang)}`);
  if (tr(p.headline, lang)) out.push("", tr(p.headline, lang));
  const contact = join([tr(p.location, lang), p.email, p.phone], " | ");
  if (contact) out.push("", contact);

  if (tr(p.summary, lang)) {
    h(L.summary);
    out.push(tr(p.summary, lang));
  }
  if (data.experience.length) {
    h(L.experience);
    for (const e of data.experience) {
      out.push(`### ${join([tr(e.role, lang), tr(e.company, lang)], " — ")}`);
      out.push(join([formatPeriod(e.start, e.end, lang), tr(e.location, lang)]));
      if (tr(e.description, lang)) out.push("", tr(e.description, lang));
      const bullets = trList(e.highlights, lang);
      if (bullets.length) out.push("", ...bullets.map((b) => `- ${b}`));
      out.push("");
    }
  }
  if (data.apps.length) {
    h(L.apps);
    for (const a of data.apps) {
      out.push(`- **${a.name}**${a.platform ? ` (${a.platform}${a.year ? `, ${a.year}` : ""})` : ""}${tr(a.tagline, lang) ? `: ${tr(a.tagline, lang)}` : ""}${a.url ? ` ${a.url}` : ""}`);
    }
  }
  if (data.gallery.length) {
    h(L.certs);
    for (const g of data.gallery) out.push(`- ${join([tr(g.title, lang), tr(g.issuer, lang), formatPoint(g.date, lang)])}`);
  }
  if (data.skills.length) {
    h(L.skills);
    for (const s of data.skills) out.push(`- **${tr(s.group, lang)}:** ${s.items.join(", ")}`);
  }
  if (data.spokenLanguages.length) {
    h(L.languages);
    for (const l of data.spokenLanguages) out.push(`- ${join([tr(l.name, lang), tr(l.level, lang)], " — ")}`);
  }
  if (data.education.length) {
    h(L.education);
    for (const e of data.education) out.push(`- ${join([tr(e.degree, lang), tr(e.school, lang), formatPeriod(e.start, e.end, lang), tr(e.note, lang)])}`);
  }
  const hobbies = trList(p.hobbies, lang);
  if (hobbies.length) {
    h(L.hobbies);
    out.push(hobbies.join(", "));
  }
  if (data.links.length) {
    h(L.links);
    for (const l of data.links) out.push(`- ${l.label}: ${l.url}`);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ------------------------------------------------------------- AI hand-off */

export function withoutContact(data: Resume): Resume {
  return { ...data, profile: { ...data.profile, email: "", phone: "" } };
}

/** Everything an AI assistant needs to edit the resume and hand back data the editor can load. */
export function aiPrompt(data: Resume, { includeContact }: { includeContact: boolean }): string {
  const doc = includeContact ? data : withoutContact(data);
  // updatedAt is set on publish; leaving it out keeps the AI from touching it.
  const json: Partial<Resume> = { ...doc };
  delete json.updatedAt;
  return `You are helping me update my resume. It is stored as JSON and shown on a bilingual (English/Thai) website.

## What I want
[Write your request here, e.g. "Add my new job: …", "Make the highlights shorter", "Translate the Thai text to match the English".]

## Rules for your reply
- Reply with the complete updated JSON in one \`\`\`json code block. Keep the same structure and keys.
- Keep every existing "id" unchanged. New items need a new unique "id" (any short unique string).
- Text fields with "en" and "th" must be filled in both languages, natural and professional. Don't leave one language empty unless I ask.
- Dates are "YYYY-MM" or "YYYY". An empty "end" means the role is ongoing.
- Don't change, add or remove image or file links (photo, icon, image, file, screenshots, photos, resumeFile). Keep them exactly as they are.
- Keep "pdf" (whether an item appears in the one-page PDF), "sections" and "version" as they are unless I ask.
- Don't invent facts, numbers, employers, dates or certificates. If something is missing, ask me instead.${includeContact ? "" : '\n- "email" and "phone" were left blank on purpose; leave them blank.'}

## My resume (readable)
${toMarkdown(doc, "en")}
## My resume (JSON to edit)
\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\`
`;
}

/** Pulls JSON out of an AI reply: a ```json block, a bare object, or the whole text. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(candidate.trim());
}

export type ParseResult = { ok: true; data: Resume } | { ok: false; error: string };

/** Validates pasted JSON. Blank contact details are restored from the current data, since exports can omit them. */
export function parsePasted(text: string, current: Resume): ParseResult {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch {
    return { ok: false, error: "Couldn't find valid JSON in that text. Paste the whole reply, or just the ```json block." };
  }
  const parsed = resumeSchema.safeParse(raw);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `The JSON doesn't match the resume format at ${i.path.join(" › ") || "the top level"}: ${i.message}` };
  }
  const next = parsed.data;
  next.profile.email ||= current.profile.email;
  next.profile.phone ||= current.profile.phone;
  next.updatedAt = current.updatedAt;
  return { ok: true, data: next };
}

/* ------------------------------------------------------------- Change summary */

export type Change = { section: string; added: string[]; removed: string[]; changed: string[] };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function diffList<T>(section: string, before: T[], after: T[], key: (x: T) => string, label: (x: T) => string): Change | null {
  const b = new Map(before.map((x) => [key(x), x]));
  const a = new Map(after.map((x) => [key(x), x]));
  const added = after.filter((x) => !b.has(key(x))).map(label);
  const removed = before.filter((x) => !a.has(key(x))).map(label);
  const changed = after.filter((x) => b.has(key(x)) && !same(b.get(key(x)), x)).map(label);
  const reordered = !added.length && !removed.length && !same(before.map(key), after.map(key));
  if (reordered) changed.push("order");
  return added.length || removed.length || changed.length ? { section, added, removed, changed } : null;
}

const en = (v: { en: string; th: string }) => tr(v, "en") || "untitled";

export function summarizeChanges(before: Resume, after: Resume): Change[] {
  const profileKeys = Object.keys(after.profile) as (keyof Resume["profile"])[];
  const profileChanged = profileKeys.filter((k) => !same(before.profile[k], after.profile[k]));
  const out: (Change | null)[] = [
    profileChanged.length ? { section: "Profile", added: [], removed: [], changed: profileChanged as string[] } : null,
    diffList("Experience", before.experience, after.experience, (x) => x.id, (x) => en(x.company)),
    diffList("Apps", before.apps, after.apps, (x) => x.id, (x) => x.name),
    diffList("Certificates", before.gallery, after.gallery, (x) => x.id, (x) => en(x.title)),
    diffList("Photos", before.photos, after.photos, (x) => x.src, (x) => tr(x.caption, "en") || "photo"),
    diffList("Skills", before.skills, after.skills, (x) => x.id, (x) => en(x.group)),
    diffList("Languages", before.spokenLanguages, after.spokenLanguages, (x) => x.id, (x) => en(x.name)),
    diffList("Education", before.education, after.education, (x) => x.id, (x) => en(x.school)),
    diffList("Links", before.links, after.links, (x) => x.id, (x) => x.label),
    same(before.sections, after.sections) ? null : { section: "Visibility", added: [], removed: [], changed: ["sections"] },
  ];
  return out.filter((c): c is Change => c !== null);
}

/** Image or file links that the new data dropped; usually a sign the AI mangled something. */
export function droppedMedia(before: Resume, after: Resume): number {
  const collect = (v: unknown, s: Set<string>) => {
    if (typeof v === "string") {
      if (/^https?:\/\/.+\/storage\/v1\/object\/public\//.test(v)) s.add(v);
    } else if (Array.isArray(v)) v.forEach((x) => collect(x, s));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => collect(x, s));
  };
  const b = new Set<string>();
  const a = new Set<string>();
  collect(before, b);
  collect(after, a);
  return [...b].filter((x) => !a.has(x)).length;
}
