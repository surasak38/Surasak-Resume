import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { get as blobGet, put as blobPut } from "@vercel/blob";

/**
 * Two kinds of storage:
 *
 * 1. The resume document — one JSON blob, so only get/set.
 *    - "redis": Upstash Redis REST (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)
 *    - "blob":  private Vercel Blob (BLOB_READ_WRITE_TOKEN)
 *    - "file":  data/resume-v2.json on disk (local dev / self-hosting)
 *
 * 2. Uploaded files (photos, screenshots, certificates, PDFs).
 *    - Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise data/uploads/ on disk.
 *    Files are private and served through /media/[...path].
 */
export interface Storage {
  readonly name: string;
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
}

export interface StoredFile {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  size: number | null;
}

export interface FileStore {
  readonly name: string;
  put(pathname: string, data: Uint8Array, contentType: string): Promise<void>;
  get(pathname: string): Promise<StoredFile | null>;
}

const KEY = process.env.RESUME_STORAGE_KEY || "resume:v2";
const DATA_DIR = path.join(process.cwd(), "data");

const isNotFound = (err: unknown) =>
  (err as Error)?.name === "BlobNotFoundError" || (err as NodeJS.ErrnoException)?.code === "ENOENT";

function redisStorage(url: string, token: string): Storage {
  async function command(args: string[]) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
    if (!res.ok || body.error) throw new Error(`Redis ${args[0]} failed: ${body.error ?? res.status}`);
    return body.result;
  }
  return {
    name: "redis",
    async get() {
      const result = await command(["GET", KEY]);
      return typeof result === "string" ? result : null;
    },
    async set(value) {
      await command(["SET", KEY, value]);
    },
  };
}

function blobStorage(): Storage {
  const pathname = `${KEY.replace(/:/g, "-")}.json`;
  return {
    name: "blob",
    async get() {
      try {
        const res = await blobGet(pathname, { access: "private", useCache: false });
        if (!res || res.statusCode !== 200) return null;
        return await new Response(res.stream).text();
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
    async set(value) {
      await blobPut(pathname, value, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
  };
}

function fileStorage(file: string): Storage {
  return {
    name: "file",
    async get() {
      try {
        return await fs.readFile(file, "utf8");
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
    async set(value) {
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, value, "utf8");
      await fs.rename(tmp, file);
    },
  };
}

export function getStorage(): Storage {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const driver =
    process.env.RESUME_STORAGE ||
    (url && token ? "redis" : process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "file");

  if (driver === "redis") {
    if (!url || !token) throw new Error("RESUME_STORAGE=redis needs KV_REST_API_URL and KV_REST_API_TOKEN");
    return redisStorage(url, token);
  }
  if (driver === "blob") return blobStorage();
  return fileStorage(process.env.RESUME_FILE || path.join(DATA_DIR, "resume-v2.json"));
}

const EXT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
};

export function contentTypeFor(pathname: string) {
  return EXT_TYPES[pathname.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

function blobFileStore(): FileStore {
  return {
    name: "blob",
    async put(pathname, data, contentType) {
      await blobPut(pathname, Buffer.from(data), { access: "private", contentType, addRandomSuffix: false });
    },
    async get(pathname) {
      try {
        const res = await blobGet(pathname, { access: "private" });
        if (!res || res.statusCode !== 200) return null;
        return { stream: res.stream, contentType: res.blob.contentType, size: res.blob.size };
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  };
}

function diskFileStore(root: string): FileStore {
  const resolve = (pathname: string) => {
    const full = path.resolve(root, pathname);
    if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error("Invalid path");
    return full;
  };
  return {
    name: "file",
    async put(pathname, data) {
      const full = resolve(pathname);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, data);
    },
    async get(pathname) {
      try {
        const data = await fs.readFile(resolve(pathname));
        return { stream: new Response(data).body!, contentType: contentTypeFor(pathname), size: data.byteLength };
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  };
}

export function getFileStore(): FileStore {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobFileStore();
  return diskFileStore(process.env.UPLOADS_DIR || DATA_DIR);
}
