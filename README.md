# RepTrack — Exercise Tracker

A mobile-first workout logging PWA built with Next.js, Supabase, and Vercel.

## Features

- Log sets, reps, and weight for any exercise
- Custom exercise creation with optional photo (camera capture)
- Exercise search/filter by muscle group
- Favorite exercises for quick access
- Workout history view
- Works offline-first; installable as PWA on iOS/Android

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| File storage | Vercel Blob |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set up environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Get Supabase credentials from **Supabase Dashboard → Settings → API**.

Get Blob token from **Vercel Dashboard → Storage → Blob**.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Schema

Three tables in Supabase:

- **`exercises`** — exercise library (name, muscle group, image URL)
- **`workout_logs`** — one row per workout session
- **`reps`** — individual sets within a workout log (exercise, weight, reps)

## Project Structure

```
app/                  # Next.js App Router pages and layouts
components/           # React components
  ui/                 # shadcn/ui primitives
lib/
  actions.ts          # Server actions (all DB mutations)
  types.ts            # Shared TypeScript types
  supabase/           # Supabase client helpers
public/               # Static assets
```

## License

Apache 2.0 — see [LICENSE](LICENSE).
