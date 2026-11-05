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
| `redis` (Upstash REST) | `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set | Vercel (its filesystem is read-only) |

**Recommended for production: Vercel + Upstash Redis.** In the Vercel project go to *Storage → Create → Upstash (Redis)* and connect it; the env vars are added automatically. The free tier is far more than a resume needs, and the public page is cached by Next.js (`'use cache'` + `cacheTag`), so Redis is only read after you publish.

Other options if you outgrow this:

- **Postgres (Neon / Supabase) + Drizzle** — if you want per-item tables, history, or multiple users.
- **Supabase** — DB, auth and file storage in one place; swap `src/lib/auth.ts` for Supabase Auth.
- **Git as the database** — commit `resume.json` through the GitHub API on publish; every change is versioned, but each save triggers a redeploy.
- **Vercel Blob** — for uploading a profile photo and PDF resume instead of pasting URLs.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add env vars: `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
3. Connect Upstash Redis from *Storage*.
4. Deploy, open `/admin`, edit, and press Publish.
