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
      className="flex items-center gap-2.5 px-3 py-2.5 bg-secondary rounded-xl cursor-pointer transition-colors hover:bg-secondary/80"
      onClick={() => setShowDelete(!showDelete)}
    >
      <span className="text-[10px] font-bold text-muted-foreground w-5 text-center">
        {rep.set_number}
      </span>
      <span className="text-sm font-bold flex-1">
        {rep.weight_lbs} <span className="text-muted-foreground font-medium text-xs">lbs</span>{' '}
        <span className="text-muted-foreground font-bold">×</span> {rep.rep_count}
      </span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          className="p-1.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}
