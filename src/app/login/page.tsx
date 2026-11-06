import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" intro="Edit your resume, photos and one-page PDF.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
