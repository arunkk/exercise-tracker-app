'use client'

import type { Exercise } from '@/lib/types'
import { Dumbbell, Cpu } from 'lucide-react'

interface ExerciseCardProps {
  exercise: Exercise
  isSelected: boolean
  onSelect: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, isSelected, onSelect }: ExerciseCardProps) {
  return (
    <button
      onClick={() => onSelect(exercise)}
      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full ${
        isSelected
          ? 'bg-primary text-primary-foreground ring-2 ring-primary'
          : 'bg-card hover:bg-muted border border-border'
      }`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
      }`}>
        {exercise.image_url ? (
          <img
            src={`/api/file?pathname=${encodeURIComponent(exercise.image_url)}`}
            alt={exercise.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : exercise.is_machine ? (
          <Cpu className="w-5 h-5" />
        ) : (
          <Dumbbell className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{exercise.name}</p>
        <p className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {exercise.muscle_group} {exercise.is_machine && '• Machine'}
        </p>
      </div>
    </button>
  )
}
