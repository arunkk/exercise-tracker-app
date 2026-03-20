'use client'

import { X } from '@phosphor-icons/react'
import { useState } from 'react'
import type { Rep } from '@/lib/types'
import { deleteSet } from '@/lib/actions'
import { toast } from 'sonner'

interface SetRowProps {
  rep: Rep
  onDeleted: () => void
}

export function SetRow({ rep, onDeleted }: SetRowProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSet(rep.id)
      onDeleted()
    } catch {
      toast.error('Failed to delete set')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
      onClick={() => setShowDelete(!showDelete)}
    >
      <span className="text-xs font-medium text-muted-foreground w-5">
        {rep.set_number}
      </span>
      <span className="text-sm font-medium flex-1">
        {rep.weight_lbs} lbs <span className="text-muted-foreground">x</span> {rep.reps_count}
      </span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          className="p-1 text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}
