'use client'

import { X } from 'lucide-react'
import type { SetInput as SetInputType } from '@/lib/types'

interface SetInputProps {
  index: number
  set: SetInputType
  onChange: (index: number, set: SetInputType) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function SetInput({ index, set, onChange, onRemove, canRemove }: SetInputProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
        {index + 1}
      </div>
      
      <div className="flex-1 flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Weight (lbs)</label>
          <input
            type="number"
            inputMode="decimal"
            value={set.weight_lbs || ''}
            onChange={(e) => onChange(index, { ...set, weight_lbs: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-input rounded-lg text-foreground font-medium text-center border-0 focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
        </div>
        
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            value={set.reps_count || ''}
            onChange={(e) => onChange(index, { ...set, reps_count: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-input rounded-lg text-foreground font-medium text-center border-0 focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
        </div>
      </div>
      
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
