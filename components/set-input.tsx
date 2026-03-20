'use client'

import { Check } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface SetInputProps {
  onSubmit: (weight: number, reps: number) => Promise<void>
  /** Prefill from last session (updates when hints load or date changes). */
  initialWeight?: number
  initialReps?: number
}

export function SetInput({ onSubmit, initialWeight, initialReps }: SetInputProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  useEffect(() => {
    if (initialWeight != null && initialWeight > 0) setWeight(String(initialWeight))
    else setWeight('')
    if (initialReps != null && initialReps > 0) setReps(String(initialReps))
    else setReps('')
  }, [initialWeight, initialReps])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (!w || !r || w <= 0 || r <= 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(w, r)
      setWeight('')
      setReps('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = parseFloat(weight) > 0 && parseInt(reps) > 0 && !isSubmitting

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border border-border">
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="lbs"
        min="0"
        className="w-20 px-2 py-1.5 bg-background rounded-md text-sm font-medium text-center border border-border focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">x</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        min="0"
        className="w-20 px-2 py-1.5 bg-background rounded-md text-sm font-medium text-center border border-border focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="ml-auto p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-30 transition-opacity"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check size={16} weight="bold" />
        )}
      </button>
    </div>
  )
}
