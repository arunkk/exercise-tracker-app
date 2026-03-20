# RepTrack UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the exercise tracker from a 4-step logging flow to a speed-first 2-tap inline logging experience with a clean minimal light theme.

**Architecture:** Replace the current two-step exercise-logger (select → log screen) with an accordion card system where tapping an exercise expands it inline to reveal a set input row. Each set is saved individually via a new `logSet` server action. Theme switches from dark-first green to light-first with white backgrounds and thin borders.

**Tech Stack:** Next.js 16, Supabase, shadcn/ui, Tailwind CSS v4, Phosphor Icons, sonner (toasts)

**Spec:** `docs/superpowers/specs/2026-03-20-ux-redesign-design.md`

---

## File Structure

### Modified Files

| File | Responsibility |
|------|---------------|
| `app/globals.css` | Light-first OKLch color palette, letter-spacing |
| `app/layout.tsx` | ThemeProvider, Toaster, remove dark default, remove Inter |
| `lib/actions.ts` | New per-set server actions, pagination, remove old createWorkoutLog |
| `components/home-page.tsx` | Simplified header, inline stats, suggestion banner, accordion state |
| `components/exercise-logger.tsx` | Accordion card list replacing two-step flow |
| `components/exercise-card.tsx` | Collapsed/expanded states with inline set logging |
| `components/set-input.tsx` | Single inline row: weight × reps × checkmark |
| `components/add-exercise-modal.tsx` | Rewrite as shadcn Sheet bottom sheet |
| `components/workout-log-item.tsx` | Lighter cards, AlertDialog delete |

### New Files

| File | Responsibility |
|------|---------------|
| `components/suggestion-banner.tsx` | Dismissible pattern suggestion card |
| `components/set-row.tsx` | Read-only logged set display with delete |

---

## Task 1: Install Phosphor Icons

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @phosphor-icons/react**

```bash
npm install @phosphor-icons/react
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@phosphor-icons/react')"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @phosphor-icons/react for clean minimal icons"
```

---

## Task 2: Theme — Light-First Color Palette

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update globals.css light mode variables**

Replace the `:root` block in `app/globals.css` with these values (keep `.dark` block unchanged for future use):

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.13 0 0);
  --card: oklch(0.975 0 0);
  --card-foreground: oklch(0.13 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.13 0 0);
  --primary: oklch(0.6 0.19 145);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.965 0 0);
  --secondary-foreground: oklch(0.13 0 0);
  --muted: oklch(0.965 0 0);
  --muted-foreground: oklch(0.46 0 0);
  --accent: oklch(0.6 0.19 145);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.92 0 0);
  --input: oklch(0.975 0 0);
  --ring: oklch(0.6 0.19 145);
  --chart-1: oklch(0.6 0.19 145);
  --chart-2: oklch(0.6 0.15 200);
  --chart-3: oklch(0.65 0.18 280);
  --chart-4: oklch(0.7 0.15 60);
  --chart-5: oklch(0.5 0.2 30);
  --radius: 0.75rem;
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.13 0 0);
  --sidebar-primary: oklch(0.6 0.19 145);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.965 0 0);
  --sidebar-accent-foreground: oklch(0.13 0 0);
  --sidebar-border: oklch(0.92 0 0);
  --sidebar-ring: oklch(0.6 0.19 145);
}
```

- [ ] **Step 2: Add letter-spacing to body in globals.css**

Add to the `@layer base` body rule:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    letter-spacing: -0.01em;
  }
}
```

- [ ] **Step 3: Update layout.tsx — remove dark, add ThemeProvider + Toaster**

Replace entire `app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'RepTrack - Exercise Logger',
  description: 'Track your workouts, log your reps, and build better habits',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RepTrack',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFFFF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-center" duration={2000} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify the app loads with light theme**

```bash
# Dev server should already be running; if not:
npm run dev
```

Open http://localhost:3000 — should show light white background instead of dark.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: switch to light-first minimal theme with ThemeProvider and Toaster"
```

---

## Task 3: Server Actions — Per-Set Logging

**Files:**
- Modify: `lib/actions.ts`

- [ ] **Step 1: Add logSet server action**

Add after the `getWorkoutLogs` function in `lib/actions.ts`:

```ts
export async function logSet(
  exerciseId: string,
  weightLbs: number,
  repsCount: number
): Promise<{ rep: Rep; setCount: number }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find or create today's workout log for this exercise
  let { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', today)
    .single()

  if (!log) {
    const { data: newLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({ exercise_id: exerciseId, workout_date: today })
      .select('id')
      .single()
    if (logError) throw logError
    log = newLog
  }

  // Get next set number
  const { count } = await supabase
    .from('reps')
    .select('*', { count: 'exact', head: true })
    .eq('workout_log_id', log!.id)

  const setNumber = (count || 0) + 1

  // Insert the rep
  const { data: rep, error: repError } = await supabase
    .from('reps')
    .insert({
      workout_log_id: log!.id,
      weight_lbs: weightLbs,
      rep_count: repsCount,
      set_number: setNumber,
    })
    .select()
    .single()

  if (repError) throw repError

  revalidatePath('/')
  return { rep, setCount: setNumber }
}
```

- [ ] **Step 2: Add deleteSet server action**

Add after `logSet`:

```ts
export async function deleteSet(repId: string): Promise<void> {
  const supabase = await createClient()

  // Get the workout_log_id before deleting
  const { data: rep } = await supabase
    .from('reps')
    .select('workout_log_id')
    .eq('id', repId)
    .single()

  if (!rep) throw new Error('Set not found')

  // Delete the rep
  const { error } = await supabase.from('reps').delete().eq('id', repId)
  if (error) throw error

  // Check if the workout log is now empty
  const { count } = await supabase
    .from('reps')
    .select('*', { count: 'exact', head: true })
    .eq('workout_log_id', rep.workout_log_id)

  // If no more reps, delete the parent workout log
  if (count === 0) {
    await supabase.from('workout_logs').delete().eq('id', rep.workout_log_id)
  }

  revalidatePath('/')
}
```

- [ ] **Step 3: Add getTodaySets server action**

```ts
export async function getTodaySets(exerciseId: string): Promise<Rep[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', today)
    .single()

  if (!log) return []

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .eq('workout_log_id', log.id)
    .order('set_number')

  if (error) throw error
  return reps || []
}
```

- [ ] **Step 4: Add getLastSessionSets server action**

```ts
export async function getLastSessionSets(exerciseId: string): Promise<Rep[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find the most recent workout log for this exercise that isn't today
  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .lt('workout_date', today)
    .order('workout_date', { ascending: false })
    .limit(1)
    .single()

  if (!log) return []

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .eq('workout_log_id', log.id)
    .order('set_number')
    .limit(5)

  if (error) throw error
  return reps || []
}
```

- [ ] **Step 5: Update getWorkoutLogs to support pagination**

Replace the existing `getWorkoutLogs` function:

```ts
export async function getWorkoutLogs(
  limit = 20,
  offset = 0
): Promise<{ data: WorkoutLog[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      exercise:exercises(*),
      reps(*)
    `)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (error) throw error

  return {
    data: data || [],
    hasMore: (data?.length || 0) > limit,
  }
}
```

- [ ] **Step 6: Remove old createWorkoutLog**

Delete the `createWorkoutLog` function (lines 36-73 of current `lib/actions.ts`). It is replaced by `logSet`.

- [ ] **Step 7: Add Rep to the imports in actions.ts**

Update the import at the top of `lib/actions.ts`:

```ts
import type { Exercise, WorkoutLog, SetInput, MuscleGroup, Rep } from './types'
```

- [ ] **Step 8: Verify the build compiles**

```bash
npx next build 2>&1 | tail -20
```

Note: There will be type errors in components that still reference `createWorkoutLog` — that's expected. The server actions themselves should compile.

- [ ] **Step 9: Commit**

```bash
git add lib/actions.ts
git commit -m "feat: add per-set logging actions (logSet, deleteSet, getTodaySets, getLastSessionSets)"
```

---

## Task 4: Suggestion Banner Component

**Files:**
- Create: `components/suggestion-banner.tsx`

- [ ] **Step 1: Create suggestion-banner.tsx**

```tsx
'use client'

import { Fire, X } from '@phosphor-icons/react'
import { useState } from 'react'
import type { MuscleGroup } from '@/lib/types'

interface SuggestionBannerProps {
  suggestedMuscleGroup: MuscleGroup
  onFilter: (muscleGroup: MuscleGroup) => void
}

export function SuggestionBanner({ suggestedMuscleGroup, onFilter }: SuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 rounded-lg">
      <Fire size={20} className="text-primary flex-shrink-0" weight="fill" />
      <button
        onClick={() => onFilter(suggestedMuscleGroup)}
        className="flex-1 text-sm font-medium text-foreground text-left"
      >
        {suggestedMuscleGroup} day?
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/suggestion-banner.tsx
git commit -m "feat: add suggestion banner component with Phosphor icons"
```

---

## Task 5: Set Row Component (Read-Only Logged Set)

**Files:**
- Create: `components/set-row.tsx`

- [ ] **Step 1: Create set-row.tsx**

```tsx
'use client'

import { X } from '@phosphor-icons/react'
import { useState } from 'react'
import type { Rep } from '@/lib/types'
import { deleteSet } from '@/lib/actions'
import { toast } from 'sonner'

interface SetRowProps {
  rep: Rep
  onDeleted: () => void
}

export function SetRow({ rep, onDeleted }: SetRowProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSet(rep.id)
      onDeleted()
    } catch {
      toast.error('Failed to delete set')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
      onClick={() => setShowDelete(!showDelete)}
    >
      <span className="text-xs font-medium text-muted-foreground w-5">
        {rep.set_number}
      </span>
      <span className="text-sm font-medium flex-1">
        {rep.weight_lbs} lbs <span className="text-muted-foreground">x</span> {rep.reps_count}
      </span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          className="p-1 text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/set-row.tsx
git commit -m "feat: add set-row component for inline logged set display with delete"
```

---

## Task 6: Set Input — Inline Quick-Log Row

**Files:**
- Modify: `components/set-input.tsx`

- [ ] **Step 1: Rewrite set-input.tsx**

Replace entire file:

```tsx
'use client'

import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface SetInputProps {
  onSubmit: (weight: number, reps: number) => Promise<void>
}

export function SetInput({ onSubmit }: SetInputProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (!w || !r || w <= 0 || r <= 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(w, r)
      setWeight('')
      setReps('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = parseFloat(weight) > 0 && parseInt(reps) > 0 && !isSubmitting

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border border-border">
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="lbs"
        min="0"
        className="w-20 px-2 py-1.5 bg-background rounded-md text-sm font-medium text-center border border-border focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">x</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        min="0"
        className="w-20 px-2 py-1.5 bg-background rounded-md text-sm font-medium text-center border border-border focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="ml-auto p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-30 transition-opacity"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check size={16} weight="bold" />
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/set-input.tsx
git commit -m "feat: rewrite set-input as inline quick-log row with checkmark submit"
```

---

## Task 7: Exercise Card — Accordion with Inline Logging

**Files:**
- Modify: `components/exercise-card.tsx`

- [ ] **Step 1: Rewrite exercise-card.tsx**

Replace entire file:

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Barbell, GearSix, CaretRight } from '@phosphor-icons/react'
import type { Exercise, Rep } from '@/lib/types'
import { logSet, getTodaySets, getLastSessionSets } from '@/lib/actions'
import { SetInput } from './set-input'
import { SetRow } from './set-row'
import { toast } from 'sonner'

interface ExerciseCardProps {
  exercise: Exercise
  isExpanded: boolean
  onToggle: () => void
  onSetLogged: () => void
}

export function ExerciseCard({ exercise, isExpanded, onToggle, onSetLogged }: ExerciseCardProps) {
  const [todaySets, setTodaySets] = useState<Rep[]>([])
  const [previousSets, setPreviousSets] = useState<Rep[]>([])
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const loadSets = useCallback(async () => {
    setIsLoadingSets(true)
    try {
      const [today, previous] = await Promise.all([
        getTodaySets(exercise.id),
        getLastSessionSets(exercise.id),
      ])
      setTodaySets(today)
      setPreviousSets(previous)
    } catch {
      // Silent — sets just won't show
    } finally {
      setIsLoadingSets(false)
    }
  }, [exercise.id])

  useEffect(() => {
    if (isExpanded) {
      loadSets()
      // Auto-scroll into view
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 200)
    }
  }, [isExpanded, loadSets])

  const handleLogSet = async (weight: number, reps: number) => {
    try {
      await logSet(exercise.id, weight, reps)
      toast.success('Set logged')
      await loadSets()
      onSetLogged()
    } catch {
      toast.error('Failed to save — tap to retry')
    }
  }

  const handleSetDeleted = async () => {
    await loadSets()
    onSetLogged()
  }

  const Icon = exercise.is_machine ? GearSix : Barbell

  return (
    <div ref={cardRef} className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 p-3 w-full text-left"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          {exercise.image_url ? (
            <img
              src={`/api/file?pathname=${encodeURIComponent(exercise.image_url)}`}
              alt={exercise.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Icon size={20} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.muscle_group} {exercise.is_machine ? '· Machine' : '· Free weight'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {todaySets.length > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {todaySets.length} {todaySets.length === 1 ? 'set' : 'sets'}
            </span>
          )}
          <CaretRight
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Today's logged sets */}
          {todaySets.map((rep) => (
            <SetRow key={rep.id} rep={rep} onDeleted={handleSetDeleted} />
          ))}

          {/* Active input row */}
          <SetInput onSubmit={handleLogSet} />

          {/* Previous session hint */}
          {previousSets.length > 0 && (
            <p className="text-xs text-muted-foreground px-1 pt-1">
              Previous: {previousSets.map((r) => `${r.weight_lbs}x${r.reps_count}`).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/exercise-card.tsx
git commit -m "feat: rewrite exercise-card with accordion expand and inline set logging"
```

---

## Task 8: Exercise Logger — Accordion Card List

**Files:**
- Modify: `components/exercise-logger.tsx`

- [ ] **Step 1: Rewrite exercise-logger.tsx**

Replace entire file:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import type { Exercise, MuscleGroup } from '@/lib/types'
import { ExerciseCard } from './exercise-card'
import { AddExerciseModal } from './add-exercise-modal'

interface ExerciseLoggerProps {
  exercises: Exercise[]
  suggestedMuscleGroups: MuscleGroup[]
  onSetLogged: () => void
}

const MUSCLE_GROUPS: (MuscleGroup | 'all')[] = ['all', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']

export function ExerciseLogger({ exercises, suggestedMuscleGroups, onSetLogged }: ExerciseLoggerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [allExercises, setAllExercises] = useState(exercises)

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMuscle = filterMuscle === 'all' || ex.muscle_group === filterMuscle
      return matchesSearch && matchesMuscle
    })
  }, [allExercises, searchQuery, filterMuscle])

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    const sorted = [...filteredExercises].sort((a, b) => {
      const aIdx = suggestedMuscleGroups.indexOf(a.muscle_group)
      const bIdx = suggestedMuscleGroups.indexOf(b.muscle_group)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.muscle_group.localeCompare(b.muscle_group)
    })
    for (const ex of sorted) {
      if (!groups[ex.muscle_group]) groups[ex.muscle_group] = []
      groups[ex.muscle_group].push(ex)
    }
    return groups
  }, [filteredExercises, suggestedMuscleGroups])

  const handleExerciseCreated = (exercise: Exercise) => {
    setAllExercises((prev) => [...prev, exercise])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        {/* Search (collapsible) */}
        {showSearch && (
          <div className="relative">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-lg text-sm border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        )}

        {/* Filter pills + search toggle */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setFilterMuscle(muscle)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterMuscle === muscle
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              {muscle === 'all' ? 'All' : muscle}
              {muscle !== 'all' && suggestedMuscleGroups[0] === muscle && (
                <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full ml-1.5 align-middle" />
              )}
            </button>
          ))}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-2.5 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground flex-shrink-0"
          >
            <MagnifyingGlass size={14} />
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
          <div key={muscleGroup} className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-background py-1 z-10">
              {muscleGroup}
            </h3>
            <div className="space-y-2">
              {exs.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={expandedId === exercise.id}
                  onToggle={() => setExpandedId(expandedId === exercise.id ? null : exercise.id)}
                  onSetLogged={onSetLogged}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No exercises found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-primary text-sm font-medium"
            >
              Add a custom exercise
            </button>
          </div>
        )}

        {/* Add custom exercise button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 mt-2 border border-dashed border-border text-muted-foreground text-sm font-medium rounded-xl hover:bg-secondary/50 transition-colors"
        >
          + Add Custom Exercise
        </button>
      </div>

      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onExerciseCreated={handleExerciseCreated}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/exercise-logger.tsx
git commit -m "feat: rewrite exercise-logger as accordion card list with search toggle"
```

---

## Task 9: Home Page — Simplified Header & Stats

**Files:**
- Modify: `components/home-page.tsx`

- [ ] **Step 1: Rewrite home-page.tsx**

Replace entire file:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Barbell, ClockCounterClockwise } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import type { Exercise, WorkoutLog, MuscleGroup } from '@/lib/types'
import { ExerciseLogger } from './exercise-logger'
import { WorkoutLogItem } from './workout-log-item'
import { SuggestionBanner } from './suggestion-banner'
import { getExercises, getWorkoutLogs, analyzeWorkoutPattern } from '@/lib/actions'

type Tab = 'log' | 'history'

export function HomePage() {
  const [tab, setTab] = useState<Tab>('log')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [suggestedMuscleGroups, setSuggestedMuscleGroups] = useState<MuscleGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filterFromSuggestion, setFilterFromSuggestion] = useState<MuscleGroup | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [exercisesData, logsResult, patternData] = await Promise.all([
        getExercises(),
        getWorkoutLogs(20, 0),
        analyzeWorkoutPattern(),
      ])
      setExercises(exercisesData)
      setWorkoutLogs(logsResult.data)
      setHasMore(logsResult.hasMore)
      setSuggestedMuscleGroups(patternData.suggestedMuscleGroups)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const result = await getWorkoutLogs(20, workoutLogs.length)
      setWorkoutLogs((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSetLogged = () => {
    // Reload all data to update stats, logs, patterns
    loadData()
  }

  const handleSuggestionFilter = (muscle: MuscleGroup) => {
    setFilterFromSuggestion(muscle)
    setTab('log')
  }

  // Today's stats
  const today = new Date().toISOString().split('T')[0]
  const todaysLogs = workoutLogs.filter((log) => log.workout_date === today)
  const todaysExercises = todaysLogs.length
  const todaysSets = todaysLogs.reduce((sum, log) => sum + (log.reps?.length || 0), 0)
  const todaysVolume = todaysLogs.reduce(
    (total, log) =>
      total + (log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.reps_count, 0) || 0),
    0
  )

  // Group history by date
  const groupedHistory = workoutLogs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    const date = log.workout_date
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Barbell size={48} className="text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">RepTrack</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Suggestion banner */}
        {suggestedMuscleGroups.length > 0 && (
          <SuggestionBanner
            suggestedMuscleGroup={suggestedMuscleGroups[0]}
            onFilter={handleSuggestionFilter}
          />
        )}

        {/* Inline stats */}
        <p className="text-xs text-muted-foreground">
          {todaysSets > 0
            ? `${todaysExercises} exercise${todaysExercises !== 1 ? 's' : ''} · ${todaysSets} set${todaysSets !== 1 ? 's' : ''} · ${(todaysVolume / 1000).toFixed(1)}k lbs`
            : 'No sets logged today'}
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'log' ? (
          <ExerciseLogger
            exercises={exercises}
            suggestedMuscleGroups={suggestedMuscleGroups}
            onSetLogged={handleSetLogged}
          />
        ) : (
          <div
            className="h-full overflow-y-auto px-4 pb-4"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
                loadMore()
              }
            }}
          >
            {workoutLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClockCounterClockwise size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No workouts yet</p>
                <p className="text-sm mt-1">Your logged exercises will appear here</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, logs]) => {
                const dayExercises = logs.length
                const daySets = logs.reduce((s, l) => s + (l.reps?.length || 0), 0)
                const dayVolume = logs.reduce(
                  (t, l) => t + (l.reps?.reduce((s, r) => s + r.weight_lbs * r.reps_count, 0) || 0),
                  0
                )
                return (
                  <div key={date} className="mb-4">
                    <div className="sticky top-0 bg-background py-2 z-10">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {formatDateLabel(date)} · {dayExercises} exercise{dayExercises !== 1 ? 's' : ''} · {daySets} sets · {(dayVolume / 1000).toFixed(1)}k lbs
                      </p>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <WorkoutLogItem key={log.id} log={log} onDelete={loadData} />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-border bg-card safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setTab('log')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 min-h-[48px] transition-colors ${
              tab === 'log' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Barbell size={24} />
            <span className="text-xs font-medium">Log</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 min-h-[48px] transition-colors ${
              tab === 'history' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <ClockCounterClockwise size={24} />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home-page.tsx
git commit -m "feat: rewrite home-page with minimal header, inline stats, suggestion banner"
```

---

## Task 10: Workout Log Item — Light Theme + AlertDialog

**Files:**
- Modify: `components/workout-log-item.tsx`

- [ ] **Step 1: Rewrite workout-log-item.tsx**

Replace entire file:

```tsx
'use client'

import { useState } from 'react'
import { Barbell, GearSix, Trash } from '@phosphor-icons/react'
import type { WorkoutLog } from '@/lib/types'
import { deleteWorkoutLog } from '@/lib/actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface WorkoutLogItemProps {
  log: WorkoutLog
  onDelete?: () => void
}

export function WorkoutLogItem({ log, onDelete }: WorkoutLogItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteWorkoutLog(log.id)
      toast.success('Workout deleted')
      onDelete?.()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  const totalWeight = log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.reps_count, 0) || 0
  const Icon = log.exercise?.is_machine ? GearSix : Barbell

  return (
    <div className="p-3 bg-card rounded-xl border border-border">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          {log.exercise?.image_url ? (
            <img
              src={`/api/file?pathname=${encodeURIComponent(log.exercise.image_url)}`}
              alt={log.exercise?.name || 'Exercise'}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Icon size={20} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{log.exercise?.name || 'Unknown Exercise'}</p>
          <p className="text-xs text-muted-foreground">
            {log.exercise?.muscle_group} · {log.reps?.length || 0} sets
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {log.reps
              ?.sort((a, b) => a.set_number - b.set_number)
              .map((rep) => `${rep.weight_lbs}x${rep.reps_count}`)
              .join('  ·  ')}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-muted-foreground">
              Total: {totalWeight.toLocaleString()} lbs
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isDeleting}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash size={14} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete workout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all {log.reps?.length || 0} sets for {log.exercise?.name}. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/workout-log-item.tsx
git commit -m "feat: restyle workout-log-item with light theme, Phosphor icons, AlertDialog"
```

---

## Task 11: Add Exercise Modal — shadcn Sheet

**Files:**
- Modify: `components/add-exercise-modal.tsx`

- [ ] **Step 1: Rewrite add-exercise-modal.tsx**

Replace entire file:

```tsx
'use client'

import { useState, useRef } from 'react'
import { Camera } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import type { MuscleGroup, Exercise } from '@/lib/types'
import { createExercise } from '@/lib/actions'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onExerciseCreated: (exercise: Exercise) => void
}

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']

export function AddExerciseModal({ isOpen, onClose, onExerciseCreated }: AddExerciseModalProps) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)
  const [isMachine, setIsMachine] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: boolean; muscleGroup?: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const newErrors: { name?: boolean; muscleGroup?: boolean } = {}
    if (!name.trim()) newErrors.name = true
    if (!muscleGroup) newErrors.muscleGroup = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      let imagePathname: string | null = null
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const { pathname } = await uploadRes.json()
          imagePathname = pathname
        }
      }

      const exercise = await createExercise(name.trim(), muscleGroup!, imagePathname, isMachine)
      onExerciseCreated(exercise)
      toast.success(`${exercise.name} added`)

      // Reset
      setName('')
      setMuscleGroup(null)
      setIsMachine(false)
      setImagePreview(null)
      setImageFile(null)
      setErrors({})
      onClose()
    } catch {
      toast.error('Failed to create exercise')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Exercise</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
              placeholder="e.g., Incline Dumbbell Press"
              className={`w-full px-4 py-3 bg-secondary rounded-lg text-sm border focus:ring-2 focus:ring-primary focus:outline-none ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">Name required</p>}
          </div>

          {/* Muscle Group */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Muscle Group</label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => { setMuscleGroup(group); setErrors((p) => ({ ...p, muscleGroup: false })) }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    muscleGroup === group
                      ? 'bg-foreground text-background'
                      : `bg-secondary text-secondary-foreground border ${errors.muscleGroup ? 'border-destructive' : 'border-border'}`
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Equipment</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsMachine(false)}
                aria-pressed={!isMachine}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !isMachine ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Free weight
              </button>
              <button
                onClick={() => setIsMachine(true)}
                aria-pressed={isMachine}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isMachine ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Machine
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Photo <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-lg border border-dashed border-border flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors"
              >
                <Camera size={24} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Take photo</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-foreground text-background font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              'Create Exercise'
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/add-exercise-modal.tsx
git commit -m "feat: rewrite add-exercise as shadcn Sheet with validation and segmented controls"
```

---

## Task 12: Build Verification & Visual Check

- [ ] **Step 1: Run the build**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds (or shows only warnings, no errors).

- [ ] **Step 2: Fix any type/import errors**

If the build fails, fix the specific errors. Common issues:
- `reps_count` vs `rep_count` column name mismatches — check `scripts/001_create_tables.sql` for actual column name
- Missing imports for Phosphor icons

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open http://localhost:3000. Verify:
- Light white background
- Exercise cards visible with Phosphor icons
- Tapping a card expands it with set input row
- Logging a set via checkmark works and shows "Set logged" toast
- History tab shows grouped-by-date logs with AlertDialog delete
- Bottom nav has Phosphor icons

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors from UX redesign"
```

---

## Task 13: Final Cleanup

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 2: Verify mobile layout**

Open http://localhost:3000 in mobile viewport (375px width). Check:
- Filter pills scroll horizontally
- Exercise cards expand properly
- Set input fields are comfortable to tap
- Bottom nav has adequate touch targets (min 48px)
- Safe area padding works

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and lint fixes for UX redesign"
```
