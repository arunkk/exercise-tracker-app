'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Barbell, GearSix, CaretRight, Heart } from '@phosphor-icons/react'
import type { Exercise, Rep } from '@/lib/types'
import {
  logSet,
  getSetsForExerciseOnDate,
  getPreviousSessionSets,
} from '@/lib/actions'
import { localDateISOString } from '@/lib/date'
import { SetInput } from './set-input'
import { SetRow } from './set-row'
import { toast } from 'sonner'

interface ExerciseCardProps {
  exercise: Exercise
  isExpanded: boolean
  onToggle: () => void
  onSetLogged: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

function repCount(r: Rep): number {
  return r.rep_count
}

export function ExerciseCard({
  exercise,
  isExpanded,
  onToggle,
  onSetLogged,
  isFavorite,
  onToggleFavorite,
}: ExerciseCardProps) {
  const [workoutDate, setWorkoutDate] = useState(localDateISOString)
  const [todaySets, setTodaySets] = useState<Rep[]>([])
  const [previousSets, setPreviousSets] = useState<Rep[]>([])
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const loadSets = useCallback(async () => {
    setIsLoadingSets(true)
    try {
      const [forDate, previous] = await Promise.all([
        getSetsForExerciseOnDate(exercise.id, workoutDate),
        getPreviousSessionSets(exercise.id, workoutDate),
      ])
      setTodaySets(forDate)
      setPreviousSets(previous)
    } catch {
      // Silent — sets just won't show
    } finally {
      setIsLoadingSets(false)
    }
  }, [exercise.id, workoutDate])

  useEffect(() => {
    if (isExpanded) {
      loadSets()
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 200)
    }
  }, [isExpanded, loadSets])

  const lastHint = previousSets.length > 0 ? previousSets[previousSets.length - 1] : null

  const handleLogSet = async (weight: number, reps: number) => {
    try {
      await logSet(exercise.id, weight, reps, workoutDate)
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
  const maxDate = localDateISOString()

  return (
    <div ref={cardRef} className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Collapsed header — row + favorite (favorite does not expand) */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 min-w-0 items-center gap-3 p-3 text-left"
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
            {todaySets.length > 0 && workoutDate === maxDate && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {todaySets.length} {todaySets.length === 1 ? 'set' : 'sets'}
              </span>
            )}
            {todaySets.length > 0 && workoutDate !== maxDate && (
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {todaySets.length} on {workoutDate}
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="flex-shrink-0 px-3 flex items-center justify-center border-l border-border hover:bg-secondary/80 transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Heart
            size={22}
            weight={isFavorite ? 'fill' : 'regular'}
            className={isFavorite ? 'text-rose-500' : 'text-muted-foreground'}
          />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label
              htmlFor={`date-${exercise.id}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Workout date
            </label>
            <input
              id={`date-${exercise.id}`}
              type="date"
              value={workoutDate}
              max={maxDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="text-sm bg-secondary border border-border rounded-lg px-2 py-1.5 font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {previousSets.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Last session (before this date)
              </p>
              <p className="text-sm font-medium mt-0.5">
                {previousSets.map((r) => `${r.weight_lbs} lbs × ${repCount(r)}`).join(' · ')}
              </p>
            </div>
          )}

          {isLoadingSets && (
            <p className="text-xs text-muted-foreground px-1">Loading sets…</p>
          )}

          {/* Logged sets for selected date */}
          {todaySets.map((rep) => (
            <SetRow key={rep.id} rep={rep} onDeleted={handleSetDeleted} />
          ))}

          <SetInput
            key={`${workoutDate}-${previousSets.map((r) => r.id).join('-')}`}
            onSubmit={handleLogSet}
            initialWeight={lastHint?.weight_lbs}
            initialReps={lastHint != null ? repCount(lastHint) : undefined}
          />
        </div>
      )}
    </div>
  )
}
