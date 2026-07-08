# The Record Room

A personal vinyl collection and wishlist site. Browse the shelf, see what's on the
wishlist, and (as the owner) add, edit, and search Spotify for cover art — all
backed by Supabase.

## Stack

- Vite + React + TypeScript
- Supabase (Postgres, Auth via Google OAuth, Edge Functions)
- Spotify Web API (Client Credentials) for cover art search, via a Supabase Edge Function

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Supabase project URL, anon key, and
owner email (the Google account allowed to edit records).

## Database setup

Run `supabase/schema.sql` in your Supabase project's SQL editor. It creates the
`records` table with row-level security: anyone can read, only the owner's Google
account (set in the policy) can write.

## Spotify cover search

The `spotify-search` Edge Function (`supabase/functions/spotify-search`) requires
two secrets set in the Supabase dashboard under Edge Functions → Secrets:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

## Deployment

Deploys to Vercel; `vercel.json` handles the SPA rewrite. Set the same three env
vars from `.env.example` in the Vercel project settings.
