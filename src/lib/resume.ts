import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultResume } from "./default-data";
import { resumeSchema, type Resume } from "./schema";
import { getStorage } from "./storage";

export const RESUME_TAG = "resume";

/** Reads straight from storage. Use in the admin panel. */
export async function readResume(): Promise<Resume> {
  const raw = await getStorage().get();
  if (!raw) return defaultResume;
  const parsed = resumeSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("Stored resume failed validation, showing defaults", parsed.error.issues);
    return defaultResume;
  }
  return parsed.data;
}

/** Cached read for the public page. Invalidated by `updateTag(RESUME_TAG)` on save. */
export async function getResume(): Promise<Resume> {
  "use cache";
  cacheTag(RESUME_TAG);
  cacheLife("max");
  return readResume();
}

export async function writeResume(data: Resume): Promise<Resume> {
  const next = { ...data, updatedAt: new Date().toISOString() };
  await getStorage().set(JSON.stringify(next, null, 2));
  return next;
}

export function storageName() {
  return getStorage().name;
}
