# Contributing to exercise-tracker-app

Bug reports, feature requests, and pull requests are welcome.

## Reporting issues

Open a [GitHub issue](https://github.com/arunkk/exercise-tracker-app/issues) with:
- What you expected vs what happened
- Steps to reproduce
- Browser/OS if it's a UI issue

## Dev setup

**Prerequisites:** Node.js 20+, pnpm, a Supabase project, a Vercel Blob store.

```bash
git clone https://github.com/arunkk/exercise-tracker-app.git
cd exercise-tracker-app
pnpm install
cp .env.local.example .env.local   # then fill in your keys
pnpm dev
```

Supabase credentials: **Dashboard → Settings → API**.

Blob token: **Vercel Dashboard → Storage → Blob → your store → Tokens**.

## Environment variables

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Blob |

## Database schema

Run these in Supabase SQL Editor to create the required tables:

```sql
-- exercises library
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  image_url text,
  created_at timestamptz default now()
);

-- workout sessions
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- individual sets
create table reps (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade,
  exercise_id uuid references exercises(id),
  weight numeric,
  reps integer,
  created_at timestamptz default now()
);
```

## Testing

There is no automated test suite. Verify changes manually:

1. `pnpm dev` — confirm the dev server starts
2. Log a workout end-to-end (select exercise → add sets → save)
3. Check History tab shows the logged workout
4. If you changed image upload, test the camera capture flow on mobile or a mobile emulator

## Sending a pull request

1. Fork and create a branch: `git checkout -b feat/my-change`
2. Make changes — match existing code style (no new abstractions unless necessary)
3. Test manually per the steps above
4. Open a PR against `main` with a clear description of what and why

## License

By contributing you agree your contributions are licensed under the [Apache License 2.0](LICENSE).
