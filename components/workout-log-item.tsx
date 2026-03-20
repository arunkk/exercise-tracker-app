'use client'

import type { WorkoutLog } from '@/lib/types'
import { Trash2, Dumbbell, Cpu } from 'lucide-react'
import { deleteWorkoutLog } from '@/lib/actions'
import { useState } from 'react'

interface WorkoutLogItemProps {
  log: WorkoutLog
  onDelete?: () => void
}

export function WorkoutLogItem({ log, onDelete }: WorkoutLogItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleDelete = async () => {
    if (!confirm('Delete this workout log?')) return
    
    setIsDeleting(true)
    try {
      await deleteWorkoutLog(log.id)
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  const totalWeight = log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.reps_count, 0) || 0
  const totalReps = log.reps?.reduce((sum, rep) => sum + rep.reps_count, 0) || 0
  
  return (
    <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        {log.exercise?.image_url ? (
          <img
            src={`/api/file?pathname=${encodeURIComponent(log.exercise.image_url)}`}
            alt={log.exercise?.name || 'Exercise'}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : log.exercise?.is_machine ? (
          <Cpu className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Dumbbell className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{log.exercise?.name || 'Unknown Exercise'}</p>
            <p className="text-xs text-muted-foreground">
              {log.exercise?.muscle_group} • {formatDate(log.workout_date)}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          {log.reps?.sort((a, b) => a.set_number - b.set_number).map((rep) => (
            <span
              key={rep.id}
              className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs font-medium"
            >
              {rep.weight_lbs}lbs × {rep.reps_count}
            </span>
          ))}
        </div>
        
        <p className="mt-2 text-xs text-muted-foreground">
          {log.reps?.length} sets • {totalReps} total reps • {totalWeight.toLocaleString()} lbs volume
        </p>
      </div>
    </div>
  )
}
