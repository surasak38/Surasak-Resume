import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/admin/editor";
import { isAuthenticated } from "@/lib/auth";
import { readResume, storageName } from "@/lib/resume";

export const metadata: Metadata = { title: "Editor" };

async function AdminGate() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const data = await readResume();
  return <Editor initial={data} storage={storageName()} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading your resume…</p>}>
      <AdminGate />
    </Suspense>
  );
}
