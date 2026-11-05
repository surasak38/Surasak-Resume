import type { Resume } from "./schema";

/**
 * Starter content shown until something is saved from /admin.
 * Everything here is placeholder copy — replace it from the admin panel.
 */
export const defaultResume: Resume = {
  profile: {
    name: "Surasak",
    nameLocal: "สุรศักดิ์",
    headline: "Software engineer building calm, reliable products for the web.",
    location: "Bangkok, Thailand",
    email: "surasak.jrs@gmail.com",
    phone: "",
    avatarUrl: "",
    resumeUrl: "",
    summary:
      "I design and build web applications end to end — from the database schema to the last pixel of the interface. I care about software that is easy to use, easy to change, and quiet in production.\n\nแก้ไขข้อความนี้ได้จากหน้า /admin",
    available: true,
    availabilityText: "Open to new opportunities",
  },
  links: [
    { id: "l1", label: "GitHub", url: "https://github.com/surasak38" },
    { id: "l2", label: "LinkedIn", url: "https://www.linkedin.com/" },
  ],
  experience: [
    {
      id: "e1",
      role: "Senior Software Engineer",
      company: "Your current company",
      location: "Bangkok",
      start: "2023-01",
      end: "",
      description: "Describe the team, the product and what you own.",
      highlights: [
        "One concrete result, with a number if you have one",
        "A system you designed or a process you improved",
      ],
    },
    {
      id: "e2",
      role: "Software Engineer",
      company: "Previous company",
      location: "Bangkok",
      start: "2020-06",
      end: "2022-12",
      description: "What you built and who used it.",
      highlights: ["Shipped a feature used by thousands of people"],
    },
  ],
  projects: [
    {
      id: "p1",
      name: "This resume",
      year: "2026",
      url: "https://github.com/surasak38/surasak-resume",
      description: "A Next.js profile site with a small admin panel for editing every section.",
      tags: ["Next.js", "TypeScript", "Tailwind"],
    },
  ],
  skills: [
    { id: "s1", group: "Languages", items: ["TypeScript", "JavaScript", "SQL"] },
    { id: "s2", group: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
    { id: "s3", group: "Backend", items: ["Node.js", "PostgreSQL", "Redis"] },
    { id: "s4", group: "Tools", items: ["Git", "Docker", "Vercel"] },
  ],
  education: [
    {
      id: "ed1",
      school: "Your university",
      degree: "B.Eng. Computer Engineering",
      start: "2014",
      end: "2018",
      note: "",
    },
  ],
  sections: { about: true, experience: true, projects: true, skills: true, education: true, contact: true },
  updatedAt: "",
};
