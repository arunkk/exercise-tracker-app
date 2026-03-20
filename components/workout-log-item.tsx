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

  const totalWeight = log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.rep_count, 0) || 0
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
              .map((rep) => `${rep.weight_lbs}x${rep.rep_count}`)
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
