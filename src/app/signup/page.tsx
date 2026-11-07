import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your resume" };

export default function SignupPage() {
  return (
    <AuthShell title="Create your resume" intro="Pick the link people will use to find you, then sign up with your Gmail. You can change the link later.">
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
