import { getFileStore } from "@/lib/storage";

/** Serves uploaded files from the private store. Paths are random and never reused, so they cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");
  if (!/^uploads\/[\w-]+\/[\w-]+\.(webp|jpe?g|png|gif|pdf)$/i.test(pathname)) {
    return new Response("Not found", { status: 404 });
  }

  const file = await getFileStore().get(pathname);
  if (!file) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": file.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  });
  if (file.size != null) headers.set("Content-Length", String(file.size));
  return new Response(file.stream, { headers });
}
