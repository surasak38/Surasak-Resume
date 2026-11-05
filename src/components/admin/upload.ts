"use client";

const MAX_EDGE = 2000;
const MAX_BYTES = 4 * 1024 * 1024;

/** Shrinks photos in the browser so uploads stay small and under the server's 4 MB limit. */
async function shrinkImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  return out && out.size < file.size ? out : file;
}

export async function uploadFile(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf";
  if (!isPdf && !file.type.startsWith("image/")) throw new Error("Choose an image (JPG, PNG, WebP, GIF) or a PDF.");
  const body = isPdf ? file : await shrinkImage(file);
  if (body.size > MAX_BYTES) throw new Error(isPdf ? "PDFs must be 4 MB or smaller." : "This image is still over 4 MB after resizing.");

  const form = new FormData();
  form.append("file", body, file.name);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? `Upload failed (${res.status}).`);
  return json.url;
}
