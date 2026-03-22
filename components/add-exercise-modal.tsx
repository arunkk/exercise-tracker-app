'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import type { MuscleGroup, Exercise } from '@/lib/types'
import { createExercise } from '@/lib/actions'
import { resizeImageToThumbnail } from '@/lib/image-utils'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onExerciseCreated: (exercise: Exercise) => void
}

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Hips', 'Arms', 'Shoulders', 'Core']

export function AddExerciseModal({ isOpen, onClose, onExerciseCreated }: AddExerciseModalProps) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)
  const [isMachine, setIsMachine] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: boolean; muscleGroup?: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const newErrors: { name?: boolean; muscleGroup?: boolean } = {}
    if (!name.trim()) newErrors.name = true
    if (!muscleGroup) newErrors.muscleGroup = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      let thumbnailDataUrl: string | null = null
      if (imageFile) {
        try {
          thumbnailDataUrl = await resizeImageToThumbnail(imageFile, 200)
        } catch {
          toast.error('Failed to process image')
        }
      }

      const exercise = await createExercise(name.trim(), muscleGroup!, thumbnailDataUrl, isMachine)
      onExerciseCreated(exercise)
      toast.success(`${exercise.name} added`)

      // Reset
      setName('')
      setMuscleGroup(null)
      setIsMachine(false)
      setImagePreview(null)
      setImageFile(null)
      setErrors({})
      onClose()
    } catch {
      toast.error('Failed to create exercise')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <SheetHeader>
          <SheetTitle className="font-bold">New Exercise</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-6">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
              placeholder="e.g., Incline Dumbbell Press"
              className={`w-full px-4 py-3 bg-secondary rounded-xl text-sm font-semibold border focus:ring-2 focus:ring-primary/50 focus:outline-none placeholder:text-muted-foreground/50 placeholder:font-medium ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.name && <p className="text-xs text-destructive mt-1.5 font-medium">Name required</p>}
          </div>

          {/* Muscle Group */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Muscle Group</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => { setMuscleGroup(group); setErrors((p) => ({ ...p, muscleGroup: false })) }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    muscleGroup === group
                      ? 'pill-active text-primary-foreground'
                      : `bg-secondary text-secondary-foreground border ${errors.muscleGroup ? 'border-destructive' : 'border-border'}`
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Equipment</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsMachine(false)}
                aria-pressed={!isMachine}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all ${
                  !isMachine ? 'pill-active text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Free weight
              </button>
              <button
                onClick={() => setIsMachine(true)}
                aria-pressed={isMachine}
                className={`py-3 px-3 rounded-xl text-sm font-bold transition-all ${
                  isMachine ? 'pill-active text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                Machine
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
              Photo <span className="text-muted-foreground/50 normal-case tracking-normal font-medium">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border border-dashed border-border flex flex-col items-center gap-2 hover:bg-secondary/50 hover:border-primary/30 transition-all"
              >
                <Camera size={24} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Take photo</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              'Create Exercise'
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
