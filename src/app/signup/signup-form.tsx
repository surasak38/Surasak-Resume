"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signUp, type AuthState } from "@/app/auth/actions";
import { inputCls } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

const PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/;

type Check = { handle: string; state: "idle" | "checking" | "free" | "taken" | "invalid" };

export function SignupForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [handle, setHandle] = useState(() => (params.get("handle") ?? "").toLowerCase());
  const [check, setCheck] = useState<Check>({ handle: "", state: "idle" });

  // Ask the database whether the link is free, a moment after typing stops.
  useEffect(() => {
    if (!handle) return;
    if (!PATTERN.test(handle)) return;
    const timer = setTimeout(async () => {
      setCheck({ handle, state: "checking" });
      const { data } = await createClient().rpc("handle_available", { candidate: handle });
      setCheck({ handle, state: data ? "free" : "taken" });
    }, 350);
    return () => clearTimeout(timer);
  }, [handle]);

  const status: Check["state"] = !handle ? "idle" : !PATTERN.test(handle) ? "invalid" : check.handle === handle ? check.state : "checking";
  const message = {
    idle: "3–30 characters: lowercase letters, numbers, dot, dash or underscore.",
    checking: "Checking…",
    free: "Available",
    taken: "Taken or reserved. Try another.",
    invalid: "Use lowercase letters, numbers, dot, dash or underscore, starting and ending with a letter or number.",
  }[status];

  if (state.notice) {
    return (
      <div role="status" className="mt-8 rounded-lg border border-ink p-5">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted">{state.notice}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm">Your name</span>
        <input name="name" required autoComplete="name" defaultValue={state.values?.name} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-sm">Your link</span>
        <div className="mt-1.5 flex items-center rounded-md border border-rule bg-paper focus-within:border-ink">
          <span className="select-none pl-3 text-muted">/</span>
          <input
            name="handle"
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, ""))}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="handle-status"
            className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none"
          />
          <span className="select-none pr-3 text-muted">/profile</span>
        </div>
        <span id="handle-status" aria-live="polite" className={`mt-1 block text-xs ${status === "free" ? "text-ink" : "text-muted"}`}>
          {status === "free" ? "✓ " : ""}
          {message}
        </span>
      </label>
      <label className="block">
        <span className="text-sm">Email</span>
        <input type="email" name="email" required autoComplete="email" defaultValue={state.values?.email} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-sm">Password</span>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm">
          {state.error}
        </p>
      )}
      <button
        disabled={pending || status === "taken" || status === "invalid"}
        className="w-full rounded-md bg-ink py-2.5 font-medium text-paper transition-opacity disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create my resume"}
      </button>
      <p className="text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
