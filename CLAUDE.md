# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BLOB_READ_WRITE_TOKEN=   # for @vercel/blob
```

## Architecture

**Next.js 16 App Router** with Supabase backend and Vercel Blob storage.

### Data Layer
- **Supabase tables**: `exercises`, `workout_logs`, `reps`
- **Server actions** (`lib/actions.ts`): all DB mutations go through server actions with `revalidatePath('/')` — no API routes for data
- **Types** (`lib/types.ts`): `Exercise`, `WorkoutLog`, `Rep`, `SetInput`, `MuscleGroup`
- Supabase clients: `lib/supabase/server.ts` (SSR/cookies) and `lib/supabase/client.ts` (browser)

### Component Structure
- `components/home-page.tsx` — root client component, owns all state, tab navigation (Log/History)
- `components/exercise-logger.tsx` — two-step flow: (1) exercise selection with search/filter, (2) set entry
- `components/add-exercise-modal.tsx` — custom exercise creation with camera capture → Vercel Blob upload
- `components/ui/` — shadcn/ui components (new-york style, neutral base color, lucide icons)

### API Routes
- `POST /api/upload` — uploads images to Vercel Blob (private)
- `GET /api/file` — serves Blob files with ETag caching

### Key Patterns
- `typescript: { ignoreBuildErrors: true }` and `images: { unoptimized: true }` in `next.config.mjs`
- Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.js` — config is in CSS)
- Dark mode by default; mobile-first with iOS PWA metadata (`apple-web-app-capable`)
- `analyzeWorkoutPattern()` in actions.ts implements a cycle-detection algorithm over last 30 logs
