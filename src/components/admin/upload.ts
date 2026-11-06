"use client";

import { createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

const MAX_EDGE = 2000;
const MAX_BYTES = 5 * 1024 * 1024;

/** The signed-in user's id; uploads go into storage/media/<id>/… which their policy allows. */
export const UploadOwner = createContext("");
export const useUploadOwner = () => useContext(UploadOwner);

/** Shrinks photos in the browser so uploads stay small. */
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

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "application/pdf": "pdf" };

export async function uploadFile(file: File, ownerId: string): Promise<string> {
  if (!ownerId) throw new Error("Sign in again to upload.");
  const isPdf = file.type === "application/pdf";
  if (!isPdf && !file.type.startsWith("image/")) throw new Error("Choose an image (JPG, PNG, WebP, GIF) or a PDF.");
  const body = isPdf ? file : await shrinkImage(file);
  const type = body.type || file.type;
  if (!EXT[type]) throw new Error("Upload a JPG, PNG, WebP, GIF or PDF file.");
  if (body.size > MAX_BYTES) throw new Error(isPdf ? "PDFs must be 5 MB or smaller." : "This image is still over 5 MB after resizing.");

  const path = `${ownerId}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${EXT[type]}`;
  const storage = createClient().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(path, body, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}
