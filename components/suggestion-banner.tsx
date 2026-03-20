'use client'

import { Fire, X } from '@phosphor-icons/react'
import { useState } from 'react'
import type { MuscleGroup } from '@/lib/types'

interface SuggestionBannerProps {
  suggestedMuscleGroup: MuscleGroup
  onFilter: (muscleGroup: MuscleGroup) => void
}

export function SuggestionBanner({ suggestedMuscleGroup, onFilter }: SuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 rounded-lg">
      <Fire size={20} className="text-primary flex-shrink-0" weight="fill" />
      <button
        onClick={() => onFilter(suggestedMuscleGroup)}
        className="flex-1 text-sm font-medium text-foreground text-left"
      >
        {suggestedMuscleGroup} day?
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
