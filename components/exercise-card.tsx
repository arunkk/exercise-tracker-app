'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Barbell, GearSix, CaretRight, Heart, PencilSimple, Camera, X, Check } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import type { Exercise, Rep, MuscleGroup } from '@/lib/types'
import {
  logSet,
  getSetsForExerciseOnDate,
  getPreviousSessionSets,
  updateExercise,
} from '@/lib/actions'
import { localDateISOString } from '@/lib/date'
import { resolvePhotoSrc, resizeImageToThumbnail } from '@/lib/image-utils'
import { SetInput } from './set-input'
import { SetRow } from './set-row'
import { toast } from 'sonner'

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Hips', 'Arms', 'Shoulders', 'Core']

interface ExerciseCardProps {
  exercise: Exercise
  isExpanded: boolean
  onToggle: () => void
  onSetLogged: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onExerciseUpdated?: (exercise: Exercise) => void
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
  onExerciseUpdated,
}: ExerciseCardProps) {
  const [workoutDate, setWorkoutDate] = useState(localDateISOString)
  const [todaySets, setTodaySets] = useState<Rep[]>([])
  const [previousSets, setPreviousSets] = useState<Rep[]>([])
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(exercise.name)
  const [editMuscleGroup, setEditMuscleGroup] = useState<MuscleGroup>(exercise.muscle_group)
  const [editIsMachine, setEditIsMachine] = useState(exercise.is_machine)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

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
      // Silent
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

  const startEditing = () => {
    setEditName(exercise.name)
    setEditMuscleGroup(exercise.muscle_group)
    setEditIsMachine(exercise.is_machine)
    setEditPhotoPreview(null)
    setEditPhotoFile(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleEditPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setEditPhotoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSavingEdit(true)
    try {
      let photoUrl = exercise.photo_url
      if (editPhotoFile) {
        try {
          photoUrl = await resizeImageToThumbnail(editPhotoFile, 200)
        } catch {
          toast.error('Failed to process image')
        }
      }

      const updates: {
        name?: string
        muscle_group?: MuscleGroup
        is_machine?: boolean
        photo_url?: string | null
      } = {}

      if (editName.trim() !== exercise.name) updates.name = editName.trim()
      if (editMuscleGroup !== exercise.muscle_group) updates.muscle_group = editMuscleGroup
      if (editIsMachine !== exercise.is_machine) updates.is_machine = editIsMachine
      if (photoUrl !== exercise.photo_url) updates.photo_url = photoUrl

      if (Object.keys(updates).length === 0) {
        setIsEditing(false)
        return
      }

      const updated = await updateExercise(exercise.id, updates)
      onExerciseUpdated?.(updated)
      toast.success('Exercise updated')
      setIsEditing(false)
    } catch {
      toast.error('Failed to update exercise')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const Icon = exercise.is_machine ? GearSix : Barbell
  const maxDate = localDateISOString()

  // --- Edit mode rendering ---
  if (isEditing) {
    const currentPhotoSrc = editPhotoPreview
      || (exercise.photo_url ? resolvePhotoSrc(exercise.photo_url) : null)

    return (
      <div ref={cardRef} className="bg-card border border-primary/30 rounded-xl overflow-hidden">
        <div className="p-3.5 space-y-3.5">
          {/* Edit header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Editing</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSavingEdit}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                aria-label="Cancel edit"
              >
                <X size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                aria-label="Save edit"
              >
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} weight="bold" />}
              </button>
            </div>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Exercise name"
            className="w-full px-3.5 py-2.5 bg-secondary rounded-xl text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none"
            autoFocus
          />

          {/* Muscle group selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Muscle Group</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setEditMuscleGroup(group)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editMuscleGroup === group
                      ? 'pill-active text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground border border-border'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment toggle */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Equipment</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setEditIsMachine(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  !editIsMachine ? 'pill-active text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Free weight
              </button>
              <button
                type="button"
                onClick={() => setEditIsMachine(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  editIsMachine ? 'pill-active text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Machine
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Photo</label>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleEditPhotoCapture}
              className="hidden"
            />
            {currentPhotoSrc ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
                <img src={currentPhotoSrc} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-bold"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="w-full py-6 rounded-xl border border-dashed border-border flex flex-col items-center gap-1.5 hover:bg-secondary/50 hover:border-primary/30 transition-all"
              >
                <Camera size={20} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Add photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- Normal rendering ---
  return (
    <div ref={cardRef} className="bg-card border border-border rounded-xl overflow-hidden card-lift">
      {/* Collapsed header */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 min-w-0 items-center gap-3 p-3 text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            {exercise.photo_url ? (
              <img
                src={resolvePhotoSrc(exercise.photo_url)}
                alt={exercise.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Icon size={20} weight="duotone" className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{exercise.name}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {exercise.muscle_group} {exercise.is_machine ? '· Machine' : '· Free weight'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {todaySets.length > 0 && workoutDate === maxDate && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {todaySets.length} {todaySets.length === 1 ? 'set' : 'sets'}
              </span>
            )}
            {todaySets.length > 0 && workoutDate !== maxDate && (
              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {todaySets.length} on {workoutDate}
              </span>
            )}
            <CaretRight
              size={14}
              weight="bold"
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
            startEditing()
          }}
          className="flex-shrink-0 px-2.5 flex items-center justify-center border-l border-border hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-primary"
          aria-label="Edit exercise"
        >
          <PencilSimple size={16} weight="bold" />
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
            size={20}
            weight={isFavorite ? 'fill' : 'regular'}
            className={isFavorite ? 'text-rose-400' : 'text-muted-foreground'}
          />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border pt-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label
              htmlFor={`date-${exercise.id}`}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
            >
              Workout date
            </label>
            <input
              id={`date-${exercise.id}`}
              type="date"
              value={workoutDate}
              max={maxDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="text-xs bg-secondary border border-border rounded-lg px-2.5 py-1.5 font-bold focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>

          {previousSets.length > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">
                Last session
              </p>
              <p className="text-sm font-bold mt-0.5">
                {previousSets.map((r) => `${r.weight_lbs} × ${repCount(r)}`).join('  ·  ')}
              </p>
            </div>
          )}

          {isLoadingSets && (
            <p className="text-xs text-muted-foreground font-medium px-1">Loading sets...</p>
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
