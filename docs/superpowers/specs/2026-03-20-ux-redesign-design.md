# RepTrack UX Redesign — Quick-Log Cards with Clean Minimal Theme

## Problem

The current app requires 4 steps to log a single set (browse exercises → select → fill 3 default sets → submit). For gym use where speed matters, this is too many taps. The dark theme with green accent feels heavy, and the visual hierarchy doesn't guide the eye to what matters during a workout.

## Goals

1. **Speed-first logging** — log a set in 2 taps + 2 numbers (exercise tap → weight/reps → checkmark)
2. **Clean minimal light theme** — white backgrounds, thin borders, one accent color, Apple Health-like aesthetic
3. **Smart suggestions front and center** — pattern detection surfaces the right exercise before you search
4. **Previous session context** — show last session's sets inline so users know what to match/beat

## Non-Goals

- Dark mode toggle UI (keep CSS support, just default to light)
- Social features, sharing, or multi-user
- Workout planning/programming
- Exercise images/illustrations overhaul

---

## Design

### 1. Theme & Visual Foundation

**Color palette (light-first):**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFFFF` | Page background |
| Surface | `#F7F7F8` | Card backgrounds, input backgrounds |
| Border | `#E8E8EC` | 1px card/input borders |
| Text primary | `#1A1A1A` | Headings, exercise names, values |
| Text secondary | `#6B6B76` | Labels, muscle group, metadata |
| Text muted | `#9C9CA8` | Placeholders, hints, timestamps |
| Accent | `#22C55E` | Checkmark button, active logging, suggestion banner |
| Accent hover | `#16A34A` | Accent interactive state |
| Destructive | `#EF4444` | Delete confirmation only |

These map to OKLch CSS variables in `globals.css` for consistency with the existing system.

**Typography:**

- Font: Geist Sans (already configured in `globals.css` as `--font-sans`) with `letter-spacing: -0.01em` globally. Remove the unused Inter import from `layout.tsx`.
- Heading: 600 weight, `text-base` (16px) — exercise names, stat labels
- Body: 500 weight, `text-sm` (14px) — set values, form labels
- Caption: 400 weight, `text-xs` (12px) — timestamps, hints, secondary info
- Stat numbers: 700 weight, `text-xl` (20px) — reduced from current 2xl

**Icons:**

- Switch from `lucide-react` to `@phosphor-icons/react` (light variant, 1.5px stroke)
- 20px inline, 24px navigation
- Key icons: Barbell, ClockCounterClockwise, MagnifyingGlass, Plus, Check, Trash, CaretLeft, Fire

**Borders & Radius:**

- Cards: `0.75rem` (12px)
- Inputs/buttons: `0.5rem` (8px)
- Badges/pills: `9999px` (full)
- No shadows on cards (flat minimal). Only `shadow-sm` on floating elements if needed.

### 2. Home Screen — Log Tab

**Header (fixed, ~56px):**

- Left: "RepTrack" text (600 weight, text-base) + today's date in caption gray
- Right: Settings icon placeholder (future use)
- No logo icon — clean text wordmark

**Suggestion Banner (conditional, below header):**

- Renders only when `analyzeWorkoutPattern()` returns a suggestion
- Horizontal card: Fire icon + "Chest day?" + tap action
- Background: `accent/10` (very light green), rounded-lg
- Dismissible with X button
- Tapping filters exercise list to suggested muscle group

**Today's Stats (single text line):**

```
3 exercises · 9 sets · 4.2k lbs
```

- Caption size, secondary text color, inline — not cards
- Updates live as sets are logged
- Shows "No sets logged today" when empty

**Muscle Group Filter Pills:**

- Horizontal scrolling row
- Inactive: white bg + 1px border
- Active: `#1A1A1A` fill + white text (not green — accent stays rare)
- Suggested group: small green dot indicator next to label

**Search:**

- Hidden by default — MagnifyingGlass icon at end of filter pill row
- Tapping reveals search input with animation (shadcn Collapsible, slides down)
- Filters exercise list in real-time

**Exercise Cards (collapsed):**

```
┌─────────────────────────────────────┐
│  ⬡ Bench Press              2 sets  │
│    Chest · Free weight        →     │
└─────────────────────────────────────┘
```

- Left: Phosphor icon (Barbell for free weight, GearSix for machine) in 36px light gray circle
- Middle: Name (600 weight) + muscle group + equipment type (caption)
- Right: Today's set count badge (if >0) + ChevronRight
- White card, 1px border, 12px radius
- Grouped by muscle group with sticky section headers
- On expand: auto-scroll the expanded card into view (smooth scroll, 200ms delay after animation starts)

**Exercise Cards (expanded — after tap):**

```
┌─────────────────────────────────────┐
│  ⬡ Bench Press              2 sets  │
│    Chest · Free weight              │
│ ┌─────────────────────────────────┐ │
│ │  135 lbs  ×  10 reps     ✓     │ │  ← logged set (read-only, gray bg)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │  [weight]    ×  [reps]    ✓    │ │  ← active input row
│ └─────────────────────────────────┘ │
│                                     │
│  Previous: 135×10, 155×8, 155×6     │  ← last session's sets
└─────────────────────────────────────┘
```

- Accordion behavior: tapping a card expands it, collapses any other open card
- Expand animation: 200ms ease-out
- Logged sets shown as read-only rows with surface background
- Active input row: weight field + "×" separator + reps field + green checkmark button
  - `inputMode="decimal"` for weight, `inputMode="numeric"` for reps
  - Tapping checkmark: logs set via server action, clears input, new row appears above
- "Previous" hint: shows last session's sets for this exercise in caption text
  - Format: `Previous: 135×10, 155×8, 155×6`
  - Fetched via new `getLastSessionSets()` server action
- If no previous data: hint not shown

**Bottom of list:**

- "+ Add Custom Exercise" text button, secondary color

**Bottom Navigation (fixed):**

- Two tabs: Barbell icon + "Log" / ClockCounterClockwise icon + "History"
- Active: primary text color. Inactive: muted text color
- Larger touch targets than current (min 48px height)
- Safe area padding preserved for iOS

### 3. History Tab

**Date Group Headers (sticky):**

```
Today · 3 exercises · 12 sets · 8.4k lbs
```

- Date label: "Today" / "Yesterday" / "Mar 18" (smart relative formatting)
- Summary stats inline, caption size, secondary color

**History Cards (per exercise per day):**

```
┌─────────────────────────────────────┐
│  ⬡ Bench Press                      │
│    Chest · 3 sets                   │
│    135×10  ·  155×8  ·  155×6       │
│    Total: 3,710 lbs          🗑     │
└─────────────────────────────────────┘
```

- Non-interactive (no expand)
- Sets as inline text with dot separators (no badge backgrounds)
- Delete: Trash icon, muted color, right-aligned on total row
- Delete confirmation: shadcn AlertDialog (replaces `window.confirm`)

**Empty State:**

- ClockCounterClockwise icon (48px, muted)
- "No workouts yet" heading
- "Your logged exercises will appear here" caption

**Pagination:**

- Infinite scroll, fetch 20 items per page
- Small spinner at bottom while loading more
- Replaces current fixed 50-item limit
- Client-side groups returned `WorkoutLog[]` by `workout_date` for the date headers
- End-of-list detected via `hasMore: false` in response (hides spinner)

### 4. Add Custom Exercise Sheet

Uses shadcn `Sheet` component (bottom sheet on mobile) instead of custom modal.

**Fields in order:**

1. **Name** — text input, required, validation on submit ("Name required" in red caption)
2. **Muscle Group** — 3-column grid of buttons
   - Inactive: white bg + border
   - Active: `#1A1A1A` fill + white text
   - Validation: brief red border flash if none selected on submit
3. **Equipment** — segmented control (two buttons side by side: "Free weight" / "Machine")
   - Uses `aria-pressed` for accessibility
4. **Photo (optional)** — camera capture button, labeled "(optional)"
   - Dashed border, Camera icon + "Take photo"
   - Preview with remove button if photo taken

**Drag handle** at top of sheet for native feel.

**Dismiss behavior:** Swipe down to close. If name field has content, show AlertDialog confirming discard.

**Success:** Sheet closes, sonner toast "Exercise name added", new exercise appears in list with brief highlight.

### 5. Feedback & States

**Toast notifications (sonner):**

- "Set logged" — brief confirmation after checkmark tap (auto-dismiss 2s)
- "Exercise name added" — after custom exercise creation
- "Workout deleted" — after delete confirmation

**Loading states:**

- Initial load: centered Barbell icon with pulse animation (existing pattern, rethemed)
- Set logging: checkmark button shows brief spinner, then success check
- History pagination: small spinner at scroll bottom

**Error handling:**

- Failed set log: toast with "Failed to save — tap to retry" (actionable)
- Failed data load: inline error message with "Retry" button (replaces silent console errors)
- Network offline: banner at top "You're offline — sets will save when you reconnect" (future, not in scope)

**Validation:**

- Add exercise: red border + caption on invalid fields
- Set input: prevent negative numbers via `min="0"` on inputs

---

## Component Changes

### Modified Files

| File | Change |
|------|--------|
| `app/globals.css` | Update OKLch variables for light-first palette |
| `app/layout.tsx` | Remove `class="dark"`, remove unused Inter import, wrap children in `<ThemeProvider defaultTheme="light">`, add `<Toaster />` for sonner, update `themeColor` to `#FFFFFF` |
| `components/home-page.tsx` | Flatten stats to inline text, add suggestion banner, simplify header |
| `components/exercise-logger.tsx` | Major rewrite — accordion card system with inline set entry |
| `components/exercise-card.tsx` | Major rewrite — collapsed/expanded states, inline set input, previous session hint |
| `components/set-input.tsx` | Simplify to single inline row: weight × reps × checkmark |
| `components/add-exercise-modal.tsx` | Rewrite using shadcn Sheet, reorder fields, segmented equipment control |
| `components/workout-log-item.tsx` | Restyle — lighter cards, inline set text, AlertDialog for delete |
| `components/theme-provider.tsx` | Keep, default to "light" |

### New Files

| File | Purpose |
|------|---------|
| `components/suggestion-banner.tsx` | Smart pattern suggestion card (Fire icon, dismissible, filters on tap) |
| `components/set-row.tsx` | Read-only logged set display row (within expanded exercise card) |

### New Dependencies

| Package | Reason |
|---------|--------|
| `@phosphor-icons/react` | Cleaner, thinner icons — replaces Lucide |

### Kept Dependencies (not removed)

| Package | Reason |
|---------|--------|
| `lucide-react` | Still used internally by shadcn UI primitives (`sheet.tsx`, `accordion.tsx`). App components switch to Phosphor, but shadcn internals keep Lucide. |

### Server Action Changes (`lib/actions.ts`)

**Per-set logging flow (core architecture change):**

The current `createWorkoutLog()` creates a `workout_logs` row and inserts all sets at once. The redesign logs one set at a time. New flow:

1. User taps checkmark → client calls `logSet(exerciseId, weight, reps)`
2. `logSet` server action:
   - Queries for an existing `workout_logs` row for this exercise + today's date
   - If none exists, creates one (find-or-create pattern)
   - Inserts a new `reps` row with the next `set_number` (max existing + 1)
   - Calls `revalidatePath('/')` to refresh stats
   - Returns the created rep + updated set count
3. The old `createWorkoutLog()` action is removed (replaced by `logSet`)

**Individual set deletion:**

Users can tap a logged set row in the expanded card to reveal a small delete (X) button. This calls `deleteSet(repId)` which removes the `reps` row. If it was the last set, the parent `workout_logs` row is also deleted.

| Action | Change |
|--------|--------|
| `logSet(exerciseId, weight, reps)` | **New** — find-or-create today's workout log, append a single set |
| `deleteSet(repId)` | **New** — delete individual set, clean up empty workout log |
| `getLastSessionSets(exerciseId)` | **New** — fetches most recent session's sets for "Previous" hint (capped at 5 sets) |
| `getTodaySets(exerciseId)` | **New** — fetches today's logged sets for the expanded card view |
| `getWorkoutLogs(limit, offset)` | **Modify** — add offset parameter, return `{ data: WorkoutLog[], hasMore: boolean }` |
| `createWorkoutLog()` | **Remove** — replaced by `logSet` |

### Unchanged

- `lib/types.ts` — data model stays the same
- `lib/supabase/*` — client setup unchanged
- `app/api/*` — upload/file routes unchanged
- `components/ui/*` — shadcn primitives unchanged (Lucide icons remain in shadcn internals)

---

## Key UX Improvements Summary

| Current | Redesigned |
|---------|-----------|
| 4 steps to log a set | 2 taps + 2 numbers |
| Dark theme, heavy feel | Light minimal, clean |
| No previous session context | "Previous" hint on every exercise |
| 3 empty default sets | One active input, add as you go |
| Suggestion buried in header | Prominent dismissible banner |
| `window.confirm()` for delete | Styled AlertDialog |
| No error feedback to user | Toast notifications + inline errors |
| Fixed 50-item history | Infinite scroll pagination |
| Lucide icons (thick strokes) | Phosphor light (thin, clean) |
| All sets submitted at once | One set at a time, instant save |
| No individual set deletion | Tap to delete any set inline |
