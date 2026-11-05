"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm">Password</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1.5 block w-full rounded-md border border-rule bg-paper px-3 py-2.5 outline-none transition-colors focus:border-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-md bg-ink py-2.5 font-medium text-paper transition-opacity disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
