import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-bold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
          Resume admin
        </h1>
        <p className="mt-2 text-muted">Sign in to edit what appears on your public page.</p>
        <LoginForm />
      </div>
    </main>
  );
}
