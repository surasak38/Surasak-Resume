# Surasak — Resume

Black-and-white, bilingual (English / Thai) profile site built with Next.js 16, with an admin panel at `/admin` for editing everything shown on the public page.

- **Public pages** (`/en`, `/th`; `/` picks one from the browser's language): hero with an animated name reveal, About with photo, Experience timeline that fills as you scroll, Apps (cards that open a screenshot viewer), Certificates & activities (filterable gallery with a lightbox), Skills & languages, Education, Contact with resume PDF download. Light/dark switch. Respects `prefers-reduced-motion`.
- **Admin** (`/admin`): password sign-in; every text field has English and Thai inputs (an empty language falls back to the other). Upload a profile photo, app icons and screenshots, certificate scans and PDFs, and a resume PDF per language. Reorder items, hide sections, download or load a JSON backup. **Publish** (or Ctrl/⌘+S) saves and refreshes the public pages right away.

## Run locally

```bash
cp .env.example .env.local   # set ADMIN_PASSWORD and AUTH_SECRET
npm install
npm run dev                  # http://localhost:3000, admin at /admin
```

Locally, data is saved to `data/resume-v2.json` and uploads to `data/uploads/` (both git-ignored). Until you publish once, the page shows the starter content in `src/lib/default-data.ts`.

## Where the data lives

The resume is a single JSON document (validated by `src/lib/schema.ts`), so storage only needs `get` and `set`. Drivers are in `src/lib/storage/index.ts`:

| Driver | When it's used | Good for |
| --- | --- | --- |
| `file` | default, no Redis env vars | local dev, Docker / VPS with a persistent disk |
| `blob` (private Vercel Blob) | `BLOB_READ_WRITE_TOKEN` is set | Vercel, zero setup beyond creating a Blob store |
| `redis` (Upstash REST) | `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set (takes priority) | Vercel, if you prefer Redis |

**Production uses Vercel Blob**: a private Blob store connected to the project holds `resume-v2.json` and every upload under `uploads/`. Uploads are served through `/media/...` with long-lived cache headers; images are resized to WebP in the browser before upload (max 4 MB per file). Upstash Redis works too (*Storage → Marketplace → Upstash*). Either way the public page is cached by Next.js (`'use cache'` + `cacheTag`), so storage is only read again after you publish.

Other options if you outgrow this:

- **Postgres (Neon / Supabase) + Drizzle** — if you want per-item tables, history, or multiple users.
- **Supabase** — DB, auth and file storage in one place; swap `src/lib/auth.ts` for Supabase Auth.
- **Git as the database** — commit `resume.json` through the GitHub API on publish; every change is versioned, but each save triggers a redeploy.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add env vars: `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
3. Create a Blob store from *Storage* and connect it to the project (adds `BLOB_READ_WRITE_TOKEN`).
4. Deploy, open `/admin`, edit, and press Publish.
