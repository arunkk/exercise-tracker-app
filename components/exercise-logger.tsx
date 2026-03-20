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
