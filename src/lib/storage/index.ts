import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * The whole resume is one JSON document, so storage only needs get/set.
 *
 * Drivers:
 *  - "redis": Upstash Redis over its REST API (Vercel Marketplace → Upstash).
 *             Picked automatically when KV_REST_API_URL / UPSTASH_REDIS_REST_URL is set.
 *  - "file":  data/resume.json on disk. Good for local dev and self-hosting
 *             (Docker / VPS). Not usable on Vercel, whose filesystem is read-only.
 */
export interface Storage {
  readonly name: string;
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
}

const KEY = process.env.RESUME_STORAGE_KEY || "resume:v1";

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

function fileStorage(file: string): Storage {
  return {
    name: "file",
    async get() {
      try {
        return await fs.readFile(file, "utf8");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
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
  const driver = process.env.RESUME_STORAGE || (url && token ? "redis" : "file");

  if (driver === "redis") {
    if (!url || !token) throw new Error("RESUME_STORAGE=redis needs KV_REST_API_URL and KV_REST_API_TOKEN");
    return redisStorage(url, token);
  }
  return fileStorage(process.env.RESUME_FILE || path.join(process.cwd(), "data", "resume.json"));
}
