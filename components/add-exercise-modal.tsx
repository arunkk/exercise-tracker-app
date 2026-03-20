'use client'

import { useState, useRef } from 'react'
import { X, Camera, Loader2 } from 'lucide-react'
import type { MuscleGroup, Exercise } from '@/lib/types'
import { createExercise } from '@/lib/actions'

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onExerciseCreated: (exercise: Exercise) => void
}

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']

export function AddExerciseModal({ isOpen, onClose, onExerciseCreated }: AddExerciseModalProps) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest')
  const [isMachine, setIsMachine] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = async () => {
    if (!name.trim()) return
    
    setIsSubmitting(true)
    try {
      let imagePathname: string | null = null
      
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (uploadRes.ok) {
          const { pathname } = await uploadRes.json()
          imagePathname = pathname
        }
      }
      
      const exercise = await createExercise(name.trim(), muscleGroup, imagePathname, isMachine)
      onExerciseCreated(exercise)
      
      // Reset form
      setName('')
      setMuscleGroup('Chest')
      setIsMachine(false)
      setImagePreview(null)
      setImageFile(null)
      onClose()
    } catch (error) {
      console.error('Failed to create exercise:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add Custom Exercise</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Photo Capture */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Photo (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setImagePreview(null)
                    setImageFile(null)
                  }}
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tap to take photo</span>
              </button>
            )}
          </div>
          
          {/* Exercise Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Exercise Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Incline Dumbbell Press"
              className="w-full px-4 py-3 bg-input rounded-xl text-foreground border-0 focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Muscle Group */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Muscle Group</label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => setMuscleGroup(group)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    muscleGroup === group
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
          
          {/* Machine Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="font-medium">Machine Exercise</span>
            <button
              onClick={() => setIsMachine(!isMachine)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                isMachine ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-foreground transition-transform ${
                  isMachine ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Exercise'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
