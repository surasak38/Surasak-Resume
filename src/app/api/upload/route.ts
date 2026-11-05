import { isAuthenticated } from "@/lib/auth";
import { getFileStore } from "@/lib/storage";

// Vercel functions accept request bodies up to 4.5 MB; images are shrunk in the browser first.
const MAX_BYTES = 4 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function sniff(bytes: Uint8Array): string | null {
  const hex = Array.from(bytes.slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";
  if (hex.startsWith("25504446")) return "application/pdf";
  return null;
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Your session expired. Sign in again." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file was sent." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Files must be 4 MB or smaller." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !TYPES[type]) {
    return Response.json({ error: "Upload a JPG, PNG, WebP, GIF or PDF file." }, { status: 415 });
  }

  const month = new Date().toISOString().slice(0, 7);
  const pathname = `uploads/${month}/${crypto.randomUUID()}.${TYPES[type]}`;
  try {
    await getFileStore().put(pathname, bytes, type);
  } catch (err) {
    console.error("Upload failed", err);
    return Response.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
  return Response.json({ url: `/media/${pathname}`, type });
}
