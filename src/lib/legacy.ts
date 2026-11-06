import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { defaultResume } from "./default-data";
import { resumeSchema, type Resume } from "./schema";
import { getFileStore, getStorage } from "./storage";
import { MEDIA_BUCKET } from "./supabase/env";
import { createClient } from "./supabase/server";

/**
 * One-time import from the single-person version, which kept one resume in Vercel Blob
 * (resume-v2.json + uploads/…) behind ADMIN_PASSWORD.
 */

export function legacyImportEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function legacyPasswordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function readLegacyResume(): Promise<Resume> {
  const raw = await getStorage().get();
  if (!raw) return defaultResume;
  const parsed = resumeSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : defaultResume;
}

function collectMedia(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    if (/^\/media\/uploads\/[\w-]+\/[\w-]+\.\w+$/.test(value)) out.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectMedia(v, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectMedia(v, out));
  }
}

function replaceMedia<T>(value: T, map: Map<string, string>): T {
  if (typeof value === "string") return (map.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((v) => replaceMedia(v, map)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceMedia(v, map)])) as T;
  }
  return value;
}

/** Copies the old resume and every file it references into this user's Supabase storage. */
export async function importLegacyInto(userId: string): Promise<{ resume: Resume; copied: number; missing: number }> {
  const resume = await readLegacyResume();
  const paths = new Set<string>();
  collectMedia(resume, paths);

  const supabase = await createClient();
  const files = getFileStore();
  const map = new Map<string, string>();
  let missing = 0;

  for (const url of paths) {
    const pathname = url.replace(/^\/media\//, "");
    const file = await files.get(pathname);
    if (!file) {
      missing++;
      continue;
    }
    const bytes = new Uint8Array(await new Response(file.stream).arrayBuffer());
    const target = `${userId}/imported/${pathname.split("/").pop()}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(target, bytes, { contentType: file.contentType, upsert: true });
    if (error) throw new Error(`Copying ${pathname} failed: ${error.message}`);
    map.set(url, supabase.storage.from(MEDIA_BUCKET).getPublicUrl(target).data.publicUrl);
  }

  return { resume: replaceMedia(resume, map), copied: map.size, missing };
}
