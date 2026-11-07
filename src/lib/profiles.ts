import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { resumeSchema, type Resume } from "./schema";
import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";

export const profileTag = (handle: string) => `profile:${handle}`;
export const DIRECTORY_TAG = "profiles";

export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/;

export type PublicProfile = { id: string; handle: string; data: Resume };

export type ProfileCard = {
  handle: string;
  name: { en: string; th: string };
  headline: { en: string; th: string };
  location: { en: string; th: string };
  photo: string;
  /** Total views, or null when the person hides their count. */
  views: number | null;
};

function parseResume(raw: unknown): Resume {
  const parsed = resumeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Stored data is written by this app, so this only happens after a schema change; keep the page up.
  console.error("Stored resume failed validation", parsed.error.issues.slice(0, 3));
  return resumeSchema.parse({ profile: { name: { en: "Unnamed", th: "" } } });
}

/** A public resume by handle. Cached; invalidated with updateTag(profileTag(handle)) on publish. */
export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheTag(profileTag(handle));
  cacheLife("days");
  const { data, error } = await createPublicClient()
    .from("profiles")
    .select("id, handle, data")
    .eq("handle", handle)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw new Error(`Loading profile failed: ${error.message}`);
  return data ? { id: data.id, handle: data.handle, data: parseResume(data.data) } : null;
}

function toCard(row: { handle: string; profile: Record<string, unknown> | null }): ProfileCard {
  const p = (row.profile ?? {}) as Record<string, { en?: string; th?: string } | string | undefined>;
  const loc = (v: unknown) => ({ en: (v as { en?: string })?.en ?? "", th: (v as { th?: string })?.th ?? "" });
  return { handle: row.handle, name: loc(p.name), headline: loc(p.headline), location: loc(p.location), photo: typeof p.photo === "string" ? p.photo : "", views: null };
}

/** Public profiles matching a search, or the most recently updated ones when the query is empty. */
export async function searchProfiles(query: string, limit = 24): Promise<ProfileCard[]> {
  "use cache";
  cacheTag(DIRECTORY_TAG);
  cacheLife("minutes");
  const q = query.trim().toLowerCase().slice(0, 60);
  let req = createPublicClient().from("profiles").select("handle, profile:data->profile").eq("is_public", true);
  if (q) {
    // Escape LIKE wildcards so a search for "100%" means the literal text.
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    req = req.ilike("search_text", like);
  }
  const { data, error } = await req.order("updated_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Search failed: ${error.message}`);
  const cards = (data ?? []).map((r) => toCard(r as { handle: string; profile: Record<string, unknown> | null }));
  if (!cards.length) return cards;

  // View totals in one call; a failure here only hides the numbers.
  const { data: counts } = await createPublicClient().rpc("profile_view_counts", { p_handles: cards.map((c) => c.handle) });
  const byHandle = new Map((counts as { handle: string; views: number }[] | null)?.map((c) => [c.handle, Number(c.views)]) ?? []);
  return cards.map((c) => ({ ...c, views: byHandle.get(c.handle) ?? null }));
}

export const viewsTag = (handle: string) => `views:${handle}`;

/** Total views of a public profile. Cached for a few minutes, so the number on the page lags slightly. */
export async function getViewCount(handle: string): Promise<number> {
  "use cache";
  cacheTag(viewsTag(handle));
  cacheLife("minutes");
  const { data, error } = await createPublicClient().rpc("profile_view_count", { p_handle: handle });
  if (error) return 0;
  return Number(data) || 0;
}

/** The signed-in user's own profile row, read through RLS. */
export async function getOwnProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, handle, data, is_public").eq("id", userId).maybeSingle();
  if (error) throw new Error(`Loading your profile failed: ${error.message}`);
  return data ? { id: data.id as string, handle: data.handle as string, isPublic: data.is_public as boolean, data: parseResume(data.data) } : null;
}

/** The handle that belongs to a user id (private profiles included, via RLS for the owner). */
export async function getHandleFor(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("handle").eq("id", userId).maybeSingle();
  return (data?.handle as string | undefined) ?? null;
}
