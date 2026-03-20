'use client'

import { useState, useMemo } from 'react'
import { Plus, Check, ChevronLeft, Search, Loader2 } from 'lucide-react'
import type { Exercise, SetInput as SetInputType, MuscleGroup } from '@/lib/types'
import { ExerciseCard } from './exercise-card'
import { SetInput } from './set-input'
import { AddExerciseModal } from './add-exercise-modal'
import { createWorkoutLog } from '@/lib/actions'

interface ExerciseLoggerProps {
  exercises: Exercise[]
  suggestedMuscleGroups: MuscleGroup[]
  onLogCreated: () => void
}

type Step = 'select' | 'log'

const DEFAULT_SETS: SetInputType[] = [
  { weight_lbs: 0, reps_count: 0 },
  { weight_lbs: 0, reps_count: 0 },
  { weight_lbs: 0, reps_count: 0 },
]

export function ExerciseLogger({ exercises, suggestedMuscleGroups, onLogCreated }: ExerciseLoggerProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState<SetInputType[]>(DEFAULT_SETS)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allExercises, setAllExercises] = useState(exercises)
  
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMuscle = filterMuscle === 'all' || ex.muscle_group === filterMuscle
      return matchesSearch && matchesMuscle
    })
  }, [allExercises, searchQuery, filterMuscle])
  
  // Group exercises by muscle group and prioritize suggested ones
  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    
    // Sort by suggested muscle groups first
    const sortedExercises = [...filteredExercises].sort((a, b) => {
      const aIndex = suggestedMuscleGroups.indexOf(a.muscle_group)
      const bIndex = suggestedMuscleGroups.indexOf(b.muscle_group)
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.muscle_group.localeCompare(b.muscle_group)
    })
    
    for (const ex of sortedExercises) {
      if (!groups[ex.muscle_group]) {
        groups[ex.muscle_group] = []
      }
      groups[ex.muscle_group].push(ex)
    }
    
    return groups
  }, [filteredExercises, suggestedMuscleGroups])
  
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setStep('log')
  }
  
  const handleSetChange = (index: number, set: SetInputType) => {
    const newSets = [...sets]
    newSets[index] = set
    setSets(newSets)
  }
  
  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index))
    }
  }
  
  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1]
    setSets([...sets, { ...lastSet }])
  }
  
  const handleSubmit = async () => {
    if (!selectedExercise) return
    
    const validSets = sets.filter((s) => s.weight_lbs > 0 || s.reps_count > 0)
    if (validSets.length === 0) return
    
    setIsSubmitting(true)
    try {
      await createWorkoutLog(selectedExercise.id, date, validSets)
      
      // Reset
      setSets(DEFAULT_SETS)
      setSelectedExercise(null)
      setStep('select')
      onLogCreated()
    } catch (error) {
      console.error('Failed to create log:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleExerciseCreated = (exercise: Exercise) => {
    setAllExercises([...allExercises, exercise])
  }
  
  const muscleGroups: (MuscleGroup | 'all')[] = ['all', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']
  
  if (step === 'log' && selectedExercise) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button
            onClick={() => setStep('select')}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-bold text-lg">{selectedExercise.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedExercise.muscle_group}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-card rounded-xl text-foreground border border-border focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Sets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground">Sets</label>
              <button
                onClick={handleAddSet}
                className="flex items-center gap-1 text-sm text-primary font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Set
              </button>
            </div>
            
            <div className="space-y-2">
              {sets.map((set, index) => (
                <SetInput
                  key={index}
                  index={index}
                  set={set}
                  onChange={handleSetChange}
                  onRemove={handleRemoveSet}
                  canRemove={sets.length > 1}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || sets.every((s) => s.weight_lbs === 0 && s.reps_count === 0)}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Log Exercise
              </>
            )}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 bg-card rounded-xl text-foreground border border-border focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setFilterMuscle(muscle)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterMuscle === muscle
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              } ${
                muscle !== 'all' && suggestedMuscleGroups.includes(muscle as MuscleGroup)
                  ? 'ring-2 ring-primary/30'
                  : ''
              }`}
            >
              {muscle === 'all' ? 'All' : muscle}
              {muscle !== 'all' && suggestedMuscleGroups[0] === muscle && (
                <span className="ml-1 text-xs opacity-70">Suggested</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
          <div key={muscleGroup} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              {muscleGroup}
              {suggestedMuscleGroups[0] === muscleGroup && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                  Next in cycle
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {exs.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExercise?.id === exercise.id}
                  onSelect={handleSelectExercise}
                />
              ))}
            </div>
          </div>
        ))}
        
        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No exercises found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-primary font-medium"
            >
              Add a custom exercise
            </button>
          </div>
        )}
      </div>
      
      {/* Add Custom Exercise Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 border-2 border-dashed border-border text-muted-foreground font-medium rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
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
