"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { HANDLE_PATTERN } from "@/lib/profiles";
import { safeNext } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string; values?: Record<string, string> };

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"), "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: /confirm/i.test(error.message)
        ? "Confirm your email first. Check your inbox for the link."
        : "That email and password don't match an account.",
      values: { email },
    };
  }
  if (next) redirect(next);
  const { data: row } = await supabase.from("profiles").select("handle").eq("id", data.user.id).maybeSingle();
  redirect(row?.handle ? `/${row.handle}/admin` : "/");
}

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_PATTERN, "Links use 3–30 lowercase letters, numbers, dots, dashes or underscores, and start and end with a letter or number."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const values = Object.fromEntries(["name", "handle", "email"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = signUpSchema.safeParse({ ...values, password: String(form.get("password") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { name, handle, email, password } = parsed.data;

  const supabase = await createClient();
  const { data: available, error: rpcError } = await supabase.rpc("handle_available", { candidate: handle });
  if (rpcError) return { error: "Couldn't check that link. Try again.", values };
  if (!available) return { error: `"${handle}" is taken or reserved. Choose another link.`, values };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { handle, name },
      emailRedirectTo: `${await origin()}/auth/confirm?next=${encodeURIComponent(`/${handle}/admin`)}`,
    },
  });
  if (error) return { error: error.message, values };

  // With email confirmation off, Supabase signs the user in straight away.
  if (data.session) redirect(`/${handle}/admin`);
  return { notice: `We sent a confirmation link to ${email}. Open it to start editing your resume.`, values };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
