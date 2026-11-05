# Surasak — Resume

Black-and-white profile site built with Next.js 16, with an admin panel at `/admin` for editing everything shown on the public page.

- **Public page** (`/`): hero with an animated name reveal, About, Experience timeline that fills as you scroll, Projects (rows invert on hover), Skills, Education, Contact. Light/dark switch with a circular reveal. Respects `prefers-reduced-motion`.
- **Admin** (`/admin`): password sign-in, edit Profile / Experience / Projects / Skills / Education / Links, reorder items, hide sections, download or load a JSON backup. **Publish** (or Ctrl/⌘+S) saves and refreshes the public page right away.

## Run locally

```bash
cp .env.example .env.local   # set ADMIN_PASSWORD and AUTH_SECRET
npm install
npm run dev                  # http://localhost:3000, admin at /admin
```

Locally, data is saved to `data/resume.json` (git-ignored). Until you publish once, the page shows the starter content in `src/lib/default-data.ts`.

## Where the data lives

The resume is a single JSON document (validated by `src/lib/schema.ts`), so storage only needs `get` and `set`. Drivers are in `src/lib/storage/index.ts`:

| Driver | When it's used | Good for |
| --- | --- | --- |
| `file` | default, no Redis env vars | local dev, Docker / VPS with a persistent disk |
| `blob` (private Vercel Blob) | `BLOB_READ_WRITE_TOKEN` is set | Vercel, zero setup beyond creating a Blob store |
| `redis` (Upstash REST) | `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set (takes priority) | Vercel, if you prefer Redis |

**Production uses Vercel Blob**: a private Blob store connected to the project holds `resume-v1.json`. Upstash Redis works too (*Storage → Marketplace → Upstash*). Either way the public page is cached by Next.js (`'use cache'` + `cacheTag`), so storage is only read again after you publish.

Other options if you outgrow this:

- **Postgres (Neon / Supabase) + Drizzle** — if you want per-item tables, history, or multiple users.
- **Supabase** — DB, auth and file storage in one place; swap `src/lib/auth.ts` for Supabase Auth.
- **Git as the database** — commit `resume.json` through the GitHub API on publish; every change is versioned, but each save triggers a redeploy.
- **Vercel Blob** — for uploading a profile photo and PDF resume instead of pasting URLs.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add env vars: `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
3. Create a Blob store from *Storage* and connect it to the project (adds `BLOB_READ_WRITE_TOKEN`).
4. Deploy, open `/admin`, edit, and press Publish.
