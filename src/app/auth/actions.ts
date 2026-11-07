"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HANDLE_PATTERN } from "@/lib/profiles";
import { safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Sends the browser to Google. Accounts are Gmail-only: the database refuses any other new sign-up.
 * From the sign-up page, `handle` carries the link the person picked; the callback claims it.
 */
export async function signInWithGoogle(_: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"), "");
  const handle = String(form.get("handle") ?? "").trim().toLowerCase();
  if (form.has("handle") && !HANDLE_PATTERN.test(handle)) {
    return { error: "Links use 3–30 lowercase letters, numbers, dots, dashes or underscores, and start and end with a letter or number." };
  }

  const supabase = await createClient();
  if (handle) {
    const { data: available, error } = await supabase.rpc("handle_available", { candidate: handle });
    if (error) return { error: "Couldn't check that link. Try again." };
    if (!available) return { error: `"${handle}" is taken or reserved. Choose another link.` };
  }

  const callback = new URL("/auth/confirm", await origin());
  if (next) callback.searchParams.set("next", next);
  if (handle) callback.searchParams.set("handle", handle);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) return { error: "Couldn't reach Google sign-in. Try again." };
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
