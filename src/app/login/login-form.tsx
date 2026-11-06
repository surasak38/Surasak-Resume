"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth/actions";
import { inputCls } from "@/components/auth/auth-shell";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  const error = state.error ?? params.get("error");
  const next = params.get("next") ?? "";

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm">Email</span>
        <input type="email" name="email" required autoComplete="email" defaultValue={state.values?.email} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-sm">Password</span>
        <input type="password" name="password" required autoComplete="current-password" className={inputCls} />
      </label>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <button disabled={pending} className="w-full rounded-md bg-ink py-2.5 font-medium text-paper transition-opacity disabled:opacity-50">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
          Create your resume
        </Link>
      </p>
    </form>
  );
}
