# Folio — bilingual resumes

A Next.js 16 app where anyone can sign up and publish a black-and-white, bilingual (English/Thai) resume page, with apps, certificates, a photo gallery and a one-page A4 PDF export. Data lives in Supabase.

## Routes

| URL | What it is |
| --- | --- |
| `/` | Landing page and people search with live suggestions (top 5 as you type; `?q=`, `?lang=en|th`) |
| `/signup`, `/login` | Google sign-in, Gmail accounts only. `/signup?handle=` pre-fills the link, `/login?next=` returns you after sign-in |
| `/auth/confirm` | Google sign-in callback: starts the session and claims the link picked at sign-up |
| `/<handle>/profile` | Public resume. `?lang=en|th`, `?app=<id>&screen=<n>`, `?photos=all|<n>`, `?cert=<id>`, `?certs=<kind>` |
| `/<handle>/admin` | Editor, owner only. `?tab=<tab>`, `?pdf=en|th` |
| `/<handle>` | Redirects to the profile |
| `/en`, `/th`, `/admin` | Old single-person URLs, redirected to `LEGACY_HANDLE` |

Handles are 3–30 lowercase letters, numbers, `.`, `-` or `_`, unique, and can be changed in the editor's **Link & account** tab. A few words used by the app (`admin`, `login`, `api`…) are reserved.

## Data

Supabase project `surasak-resume` (Singapore):

- **`public.profiles`**: one row per user: `handle` (unique), `data` (the resume document, validated by `src/lib/schema.ts`), `is_public`, and a generated `search_text` with a trigram index for search.
- **Row level security**: anyone can read public profiles; only the owner can update their row.
- **Sign-up trigger**: `handle_new_user` accepts new accounts only from Google with a `@gmail.com` address, and creates the profile with the Google name, email and photo. The link picked at sign-up is claimed by `/auth/confirm`; without one, the account starts on a `user-…` placeholder and is sent to **Link & account**.
- **Existing accounts**: signing in with Google using the same confirmed email links the Google identity to the existing account, so the profile stays the same.
- **`handle_available(text)`**: lets the forms check a link without exposing private profiles.
- **Storage bucket `media`** (public read): each user can only write inside `<their user id>/…`. Images are resized to WebP in the browser before upload (5 MB limit per file).

Public profile pages are cached per handle and refreshed when the owner publishes.

## Run locally

```bash
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm install
npm run dev
```

## Environment

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything |
| `LEGACY_HANDLE` | Where the old `/en`, `/th` and `/admin` links redirect (default `surasak.jrs`) |
| `NEXT_PUBLIC_SITE_URL` | Public address, used for share links (default `https://eresume-lab.vercel.app`) |

## Google sign-in setup

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web application). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Sign In / Providers → **Google**: enable it and paste the client ID and secret.
3. Supabase → Authentication → Sign In / Providers → **Email**: turn off sign-ups (the database refuses them anyway).
4. Supabase → Authentication → URL Configuration: Site URL = the deployed URL; add `<site>/auth/confirm` (and `http://localhost:3000/auth/confirm` for local work) to the redirect URLs.
