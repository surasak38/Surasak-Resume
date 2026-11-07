"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInWithGoogle, type AuthState } from "@/app/auth/actions";
import { GoogleButton } from "@/components/auth/google-button";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState<AuthState, FormData>(signInWithGoogle, {});
  const error = state.error ?? params.get("error");
  const next = params.get("next") ?? "";

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <GoogleButton label="Continue with Google" />
      <p className="text-xs text-muted">Only Gmail accounts can be used.</p>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
          Create your resume
        </Link>
      </p>
    </form>
  );
}
