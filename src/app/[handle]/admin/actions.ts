"use server";

import { updateTag } from "next/cache";
import { DIRECTORY_TAG, HANDLE_PATTERN, profileTag } from "@/lib/profiles";
import { importLegacyInto, legacyPasswordMatches } from "@/lib/legacy";
import { resumeSchema, type Resume } from "@/lib/schema";
import { createClient, currentUser } from "@/lib/supabase/server";

type Fail = { ok: false; error: string };
const SESSION_EXPIRED: Fail = { ok: false, error: "Your session expired. Sign in again." };

export type SaveResult = { ok: true; data: Resume } | Fail;

export async function saveResume(input: unknown): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) return SESSION_EXPIRED;

  const parsed = resumeSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(" › ") || "Data"}: ${issue.message}` };
  }
  const data = { ...parsed.data, updatedAt: new Date().toISOString() };

  const supabase = await createClient();
  const { data: row, error } = await supabase.from("profiles").update({ data }).eq("id", user.id).select("handle").single();
  if (error) return { ok: false, error: `Publishing failed: ${error.message}` };

  updateTag(profileTag(row.handle));
  updateTag(DIRECTORY_TAG);
  return { ok: true, data };
}

export type HandleResult = { ok: true; handle: string } | Fail;

export async function changeHandle(raw: string): Promise<HandleResult> {
  const user = await currentUser();
  if (!user) return SESSION_EXPIRED;
  const handle = raw.trim().toLowerCase();
  if (!HANDLE_PATTERN.test(handle)) {
    return { ok: false, error: "Use 3–30 lowercase letters, numbers, dots, dashes or underscores, starting and ending with a letter or number." };
  }

  const supabase = await createClient();
  const { data: current } = await supabase.from("profiles").select("handle").eq("id", user.id).single();
  if (current?.handle === handle) return { ok: true, handle };

  const { error } = await supabase.from("profiles").update({ handle }).eq("id", user.id);
  if (error) {
    // 23505 = unique violation, 23514 = check constraint (reserved word).
    if (error.code === "23505" || error.code === "23514") return { ok: false, error: `"${handle}" is taken or reserved. Choose another link.` };
    return { ok: false, error: `Changing your link failed: ${error.message}` };
  }
  if (current?.handle) updateTag(profileTag(current.handle));
  updateTag(profileTag(handle));
  updateTag(DIRECTORY_TAG);
  return { ok: true, handle };
}

export type VisibilityResult = { ok: true; isPublic: boolean } | Fail;

export async function setVisibility(isPublic: boolean): Promise<VisibilityResult> {
  const user = await currentUser();
  if (!user) return SESSION_EXPIRED;
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("profiles").update({ is_public: isPublic }).eq("id", user.id).select("handle").single();
  if (error) return { ok: false, error: error.message };
  updateTag(profileTag(row.handle));
  updateTag(DIRECTORY_TAG);
  return { ok: true, isPublic };
}

export type ImportResult = { ok: true; data: Resume; copied: number; missing: number } | Fail;

/** Loads the earlier single-person site's data into the editor (not published until the user presses Publish). */
export async function importLegacy(password: string): Promise<ImportResult> {
  const user = await currentUser();
  if (!user) return SESSION_EXPIRED;
  if (!legacyPasswordMatches(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, error: "That isn't the old admin password." };
  }
  try {
    const { resume, copied, missing } = await importLegacyInto(user.id);
    return { ok: true, data: resume, copied, missing };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Import failed." };
  }
}
