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
