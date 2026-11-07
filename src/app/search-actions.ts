"use server";

import { searchProfiles, type ProfileCard } from "@/lib/profiles";

/** Up to five public profiles for the search box's suggestions. Uses the same cached search as the results list. */
export async function suggestPeople(query: string): Promise<ProfileCard[]> {
  const q = String(query ?? "").trim().slice(0, 60);
  if (!q) return [];
  return searchProfiles(q, 5);
}
