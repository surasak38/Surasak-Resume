import { z } from "zod";

const id = z.string().min(1);
const text = z.string().trim();
/** "YYYY-MM" or "YYYY". Empty `end` means ongoing. */
const period = z.string().trim().regex(/^(\d{4}(-\d{2})?)?$/, "Use YYYY or YYYY-MM");
/** A file served by this site (/media/...) or an absolute URL. */
const media = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/media/") || /^https?:\/\//.test(v), "Must be an uploaded file or a URL");

const L = z.object({ en: text.default(""), th: text.default("") }).default({ en: "", th: "" });
const LList = z.object({ en: z.array(text).default([]), th: z.array(text).default([]) }).default({ en: [], th: [] });

/** Localized text where at least one language must be filled in. */
const requiredL = (message: string) => L.refine((v) => Boolean(v.en || v.th), message);

export const profileSchema = z.object({
  name: requiredL("Name is required"),
  headline: L,
  location: L,
  summary: L,
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: text.default(""),
  photo: media.default(""),
  resumeFile: z.object({ en: media.default(""), th: media.default("") }).default({ en: "", th: "" }),
  available: z.boolean().default(false),
  availabilityText: L,
});

export const spokenLanguageSchema = z.object({ id, name: L, level: L });

export const linkSchema = z.object({ id, label: text.min(1, "Link label is required"), url: text.min(1, "Link URL is required") });

export const experienceSchema = z.object({
  id,
  role: requiredL("Role is required"),
  company: requiredL("Company is required"),
  location: L,
  start: period,
  end: period.default(""),
  description: L,
  highlights: LList,
});

export const appSchema = z.object({
  id,
  name: text.min(1, "App name is required"),
  year: text.default(""),
  platform: text.default(""),
  tagline: L,
  description: L,
  tags: z.array(text).default([]),
  url: text.default(""),
  repoUrl: text.default(""),
  icon: media.default(""),
  screenshots: z.array(media).default([]),
});

export const galleryKinds = ["certificate", "training", "competition", "activity"] as const;
export type GalleryKind = (typeof galleryKinds)[number];

export const galleryItemSchema = z.object({
  id,
  kind: z.enum(galleryKinds).default("certificate"),
  title: requiredL("Title is required"),
  issuer: L,
  date: period.default(""),
  image: media.default(""),
  file: media.default(""),
  url: text.default(""),
});

export const skillGroupSchema = z.object({ id, group: L, items: z.array(text).default([]) });

export const educationSchema = z.object({
  id,
  school: requiredL("School is required"),
  degree: L,
  start: period.default(""),
  end: period.default(""),
  note: L,
});

export const sectionKeys = ["about", "experience", "apps", "gallery", "skills", "education", "contact"] as const;
export type SectionKey = (typeof sectionKeys)[number];

export const resumeSchema = z.object({
  version: z.literal(2).default(2),
  profile: profileSchema,
  spokenLanguages: z.array(spokenLanguageSchema).default([]),
  links: z.array(linkSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  apps: z.array(appSchema).default([]),
  gallery: z.array(galleryItemSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  education: z.array(educationSchema).default([]),
  sections: z
    .object(Object.fromEntries(sectionKeys.map((k) => [k, z.boolean().default(true)])) as Record<SectionKey, z.ZodDefault<z.ZodBoolean>>)
    .default(Object.fromEntries(sectionKeys.map((k) => [k, true])) as Record<SectionKey, boolean>),
  updatedAt: z.string().default(""),
});

export type Resume = z.infer<typeof resumeSchema>;
export type Profile = Resume["profile"];
export type Experience = Resume["experience"][number];
export type App = Resume["apps"][number];
export type GalleryItem = Resume["gallery"][number];
export type SkillGroup = Resume["skills"][number];
export type Education = Resume["education"][number];
export type Link = Resume["links"][number];
export type SpokenLanguage = Resume["spokenLanguages"][number];
