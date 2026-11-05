"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, isAuthenticated, passwordMatches } from "@/lib/auth";
import { RESUME_TAG, writeResume } from "@/lib/resume";
import { resumeSchema, type Resume } from "@/lib/schema";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: "ADMIN_PASSWORD is not set on the server. Add it to .env.local and restart." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    // Small delay slows down password guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password is incorrect." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export type SaveResult = { ok: true; data: Resume } | { ok: false; error: string };

export async function saveResume(input: unknown): Promise<SaveResult> {
  if (!(await isAuthenticated())) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = resumeSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(" › ") || "Data"}: ${issue.message}` };
  }

  try {
    const data = await writeResume(parsed.data);
    updateTag(RESUME_TAG);
    return { ok: true, data };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES") {
      return { ok: false, error: "This server can't write files. Connect Redis (KV_REST_API_URL / KV_REST_API_TOKEN) to save." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Saving failed." };
  }
}
