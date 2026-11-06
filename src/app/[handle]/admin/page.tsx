import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/admin/editor";
import { legacyImportEnabled } from "@/lib/legacy";
import { getOwnProfile } from "@/lib/profiles";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit your resume", robots: { index: false, follow: false } };

export default function AdminPage(props: PageProps<"/[handle]/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading your resume…</p>}>
      <AdminGate {...props} />
    </Suspense>
  );
}

async function AdminGate({ params }: PageProps<"/[handle]/admin">) {
  const { handle } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${handle}/admin`)}`);

  const own = await getOwnProfile(user.id);
  if (!own) {
    return <p className="p-8">Your account has no resume yet. Sign out and sign up again, or contact support.</p>;
  }
  // Only the owner can edit; anyone else lands on their own editor.
  if (own.handle !== handle) redirect(`/${own.handle}/admin`);

  return (
    <Editor
      initial={own.data}
      handle={own.handle}
      userId={user.id}
      email={user.email}
      isPublic={own.isPublic}
      legacyImport={legacyImportEnabled()}
    />
  );
}
