import { z } from "zod";

const id = z.string().min(1);
const text = z.string().trim();
/** "YYYY-MM" or "YYYY". Empty `end` means the role is ongoing. */
const period = z.string().trim().regex(/^(\d{4}(-\d{2})?)?$/, "Use YYYY or YYYY-MM");

export const profileSchema = z.object({
  name: text.min(1, "Name is required"),
  nameLocal: text.default(""),
  headline: text.default(""),
  location: text.default(""),
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: text.default(""),
  avatarUrl: text.default(""),
  resumeUrl: text.default(""),
  summary: text.default(""),
  available: z.boolean().default(false),
  availabilityText: text.default(""),
});

export const linkSchema = z.object({
  id,
  label: text.min(1),
  url: text.min(1),
});

export const experienceSchema = z.object({
  id,
  role: text.min(1, "Role is required"),
  company: text.min(1, "Company is required"),
  location: text.default(""),
  start: period,
  end: period.default(""),
  description: text.default(""),
  highlights: z.array(text).default([]),
});

export const projectSchema = z.object({
  id,
  name: text.min(1, "Project name is required"),
  year: text.default(""),
  url: text.default(""),
  description: text.default(""),
  tags: z.array(text).default([]),
});

export const skillGroupSchema = z.object({
  id,
  group: text.min(1, "Group name is required"),
  items: z.array(text).default([]),
});

export const educationSchema = z.object({
  id,
  school: text.min(1, "School is required"),
  degree: text.default(""),
  start: period.default(""),
  end: period.default(""),
  note: text.default(""),
});

export const sectionKeys = ["about", "experience", "projects", "skills", "education", "contact"] as const;
export type SectionKey = (typeof sectionKeys)[number];

export const resumeSchema = z.object({
  profile: profileSchema,
  links: z.array(linkSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  education: z.array(educationSchema).default([]),
  sections: z
    .object(Object.fromEntries(sectionKeys.map((k) => [k, z.boolean().default(true)])) as Record<SectionKey, z.ZodDefault<z.ZodBoolean>>)
    .default({ about: true, experience: true, projects: true, skills: true, education: true, contact: true }),
  updatedAt: z.string().default(""),
});

export type Resume = z.infer<typeof resumeSchema>;
export type Profile = Resume["profile"];
export type Experience = Resume["experience"][number];
export type Project = Resume["projects"][number];
export type SkillGroup = Resume["skills"][number];
export type Education = Resume["education"][number];
export type Link = Resume["links"][number];
