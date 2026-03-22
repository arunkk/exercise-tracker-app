'use client'

import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { resolvePhotoSrc } from '@/lib/image-utils'
import { getExerciseIcon, getGroupColors } from '@/lib/exercise-icons'
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

  const totalWeight = log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.rep_count, 0) || 0
  const retroIcon = log.exercise ? getExerciseIcon(log.exercise.name, log.exercise.muscle_group, log.exercise.is_machine) : '🏋️'
  const groupColors = log.exercise ? getGroupColors(log.exercise.muscle_group) : { bg: 'bg-secondary', border: 'border-border' }

  return (
    <div className="p-3.5 bg-card rounded-xl border border-border card-lift">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${log.exercise?.photo_url ? '' : `${groupColors.bg} ${groupColors.border}`}`}>
          {log.exercise?.photo_url ? (
            <img
              src={resolvePhotoSrc(log.exercise.photo_url)}
              alt={log.exercise?.name || 'Exercise'}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-lg leading-none" role="img" aria-label={log.exercise?.name || 'Exercise'}>{retroIcon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{log.exercise?.name || 'Unknown Exercise'}</p>
          <p className="text-[11px] text-muted-foreground font-medium">
            {log.exercise?.muscle_group} · {log.reps?.length || 0} sets
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-semibold">
            {log.reps
              ?.sort((a, b) => a.set_number - b.set_number)
              .map((rep) => `${rep.weight_lbs}×${rep.rep_count}`)
              .join('  ·  ')}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] font-bold text-primary/70">
              {totalWeight.toLocaleString()} lbs total
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isDeleting}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50"
                >
                  <Trash size={14} weight="bold" />
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
