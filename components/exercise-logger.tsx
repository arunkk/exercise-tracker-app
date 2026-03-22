'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, Heart, Plus } from '@phosphor-icons/react'
import type { Exercise, MuscleGroup } from '@/lib/types'
import { loadFavoriteIds, saveFavoriteIds } from '@/lib/favorites'
import { ExerciseCard } from './exercise-card'
import { AddExerciseModal } from './add-exercise-modal'

const LAST_EXERCISE_KEY = 'reptrack:lastExerciseId'

interface ExerciseLoggerProps {
  exercises: Exercise[]
  onSetLogged: () => void
}

const MUSCLE_GROUPS: (MuscleGroup | 'all')[] = ['all', 'Chest', 'Back', 'Legs', 'Hips', 'Arms', 'Shoulders', 'Core']

export function ExerciseLogger({ exercises, onSetLogged }: ExerciseLoggerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [allExercises, setAllExercises] = useState(exercises)
  const prefsRestoredRef = useRef(false)

  useEffect(() => {
    setFavoriteIds(loadFavoriteIds())
  }, [])

  useEffect(() => {
    setAllExercises(exercises)
  }, [exercises])

  // One-time: restore last exercise + muscle section from localStorage.
  useEffect(() => {
    if (allExercises.length === 0 || prefsRestoredRef.current) return
    prefsRestoredRef.current = true
    try {
      const saved = localStorage.getItem(LAST_EXERCISE_KEY)
      if (!saved) return
      const ex = allExercises.find((e) => e.id === saved)
      if (ex) {
        setFilterMuscle(ex.muscle_group)
        setExpandedId(saved)
      }
    } catch {
      // ignore storage errors
    }
  }, [allExercises])

  const persistLastExercise = (id: string) => {
    try {
      localStorage.setItem(LAST_EXERCISE_KEY, id)
    } catch {
      // ignore
    }
  }

  const handleToggleExercise = (exerciseId: string) => {
    setExpandedId((prev) => {
      const next = prev === exerciseId ? null : exerciseId
      if (next) persistLastExercise(next)
      return next
    })
  }

  const toggleFavorite = (exerciseId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) next.delete(exerciseId)
      else next.add(exerciseId)
      saveFavoriteIds(next)
      return next
    })
  }

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMuscle = filterMuscle === 'all' || ex.muscle_group === filterMuscle
      const matchesFavorite = !favoritesOnly || favoriteIds.has(ex.id)
      return matchesSearch && matchesMuscle && matchesFavorite
    })
  }, [allExercises, searchQuery, filterMuscle, favoritesOnly, favoriteIds])

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    const sorted = [...filteredExercises].sort((a, b) =>
      a.muscle_group.localeCompare(b.muscle_group)
    )
    for (const ex of sorted) {
      if (!groups[ex.muscle_group]) groups[ex.muscle_group] = []
      groups[ex.muscle_group].push(ex)
    }
    return groups
  }, [filteredExercises])

  const handleExerciseCreated = (exercise: Exercise) => {
    setAllExercises((prev) => [...prev, exercise])
  }

  const handleExerciseUpdated = (updated: Exercise) => {
    setAllExercises((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-4 pt-1 pb-2 space-y-2.5">
        {/* Search (collapsible) */}
        {showSearch && (
          <div className="relative">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-card rounded-xl text-sm font-medium border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        )}

        {/* Filter pills + search toggle */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              favoritesOnly
                ? 'pill-active text-primary-foreground'
                : 'bg-card text-secondary-foreground border border-border'
            }`}
            aria-pressed={favoritesOnly}
          >
            <Heart size={13} weight={favoritesOnly ? 'fill' : 'bold'} className="shrink-0" />
            Favs
          </button>
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle}
              type="button"
              onClick={() => setFilterMuscle(muscle)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterMuscle === muscle
                  ? 'pill-active text-primary-foreground'
                  : 'bg-card text-secondary-foreground border border-border'
              }`}
            >
              {muscle === 'all' ? 'All' : muscle}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`px-2.5 py-1.5 rounded-full border flex-shrink-0 transition-all ${
              showSearch
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border text-muted-foreground'
            }`}
          >
            <MagnifyingGlass size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
          <div key={muscleGroup} className="mb-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1.5 z-10">
              {muscleGroup}
            </h3>
            <div className="space-y-2">
              {exs.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={expandedId === exercise.id}
                  onToggle={() => handleToggleExercise(exercise.id)}
                  onSetLogged={onSetLogged}
                  isFavorite={favoriteIds.has(exercise.id)}
                  onToggleFavorite={() => toggleFavorite(exercise.id)}
                  onExerciseUpdated={handleExerciseUpdated}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {favoritesOnly && favoriteIds.size === 0 ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="opacity-40" />
                </div>
                <p className="text-sm font-semibold text-foreground">No favorites yet</p>
                <p className="text-sm mt-1">Tap the heart on any exercise to add it here.</p>
              </>
            ) : favoritesOnly && favoriteIds.size > 0 ? (
              <>
                <p className="text-sm font-semibold text-foreground">No favorites here</p>
                <p className="text-sm mt-1">Try another muscle filter or search.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No exercises found</p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-primary text-sm font-bold"
                >
                  Add a custom exercise
                </button>
              </>
            )}
          </div>
        )}

        {/* Add custom exercise button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full py-3.5 mt-2 border border-dashed border-border text-muted-foreground text-sm font-bold rounded-xl hover:bg-card hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} weight="bold" />
          Add Custom Exercise
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
