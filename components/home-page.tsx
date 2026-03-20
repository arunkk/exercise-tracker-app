'use client'

import { useState, useEffect, useCallback } from 'react'
import { Barbell, ClockCounterClockwise } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import type { Exercise, WorkoutLog } from '@/lib/types'
import { ExerciseLogger } from './exercise-logger'
import { WorkoutLogItem } from './workout-log-item'
import { getExercises, getWorkoutLogs } from '@/lib/actions'

type Tab = 'log' | 'history'

export function HomePage() {
  const [tab, setTab] = useState<Tab>('log')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [exercisesData, logsResult] = await Promise.all([
        getExercises(),
        getWorkoutLogs(20, 0),
      ])
      setExercises(exercisesData)
      setWorkoutLogs(logsResult.data)
      setHasMore(logsResult.hasMore)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const result = await getWorkoutLogs(20, workoutLogs.length)
      setWorkoutLogs((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSetLogged = () => {
    loadData()
  }

  // Today's stats
  const today = new Date().toISOString().split('T')[0]
  const todaysLogs = workoutLogs.filter((log) => log.workout_date === today)
  const todaysExercises = todaysLogs.length
  const todaysSets = todaysLogs.reduce((sum, log) => sum + (log.reps?.length || 0), 0)
  const todaysVolume = todaysLogs.reduce(
    (total, log) =>
      total + (log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.reps_count, 0) || 0),
    0
  )

  // Group history by date
  const groupedHistory = workoutLogs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    const date = log.workout_date
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Barbell size={48} className="text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">RepTrack</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Inline stats */}
        <p className="text-xs text-muted-foreground">
          {todaysSets > 0
            ? `${todaysExercises} exercise${todaysExercises !== 1 ? 's' : ''} · ${todaysSets} set${todaysSets !== 1 ? 's' : ''} · ${(todaysVolume / 1000).toFixed(1)}k lbs`
            : 'No sets logged today'}
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'log' ? (
          <ExerciseLogger exercises={exercises} onSetLogged={handleSetLogged} />
        ) : (
          <div
            className="h-full overflow-y-auto px-4 pb-4"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
                loadMore()
              }
            }}
          >
            {workoutLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClockCounterClockwise size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No workouts yet</p>
                <p className="text-sm mt-1">Your logged exercises will appear here</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, logs]) => {
                const dayExercises = logs.length
                const daySets = logs.reduce((s, l) => s + (l.reps?.length || 0), 0)
                const dayVolume = logs.reduce(
                  (t, l) => t + (l.reps?.reduce((s, r) => s + r.weight_lbs * r.reps_count, 0) || 0),
                  0
                )
                return (
                  <div key={date} className="mb-4">
                    <div className="sticky top-0 bg-background py-2 z-10">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {formatDateLabel(date)} · {dayExercises} exercise{dayExercises !== 1 ? 's' : ''} · {daySets} sets · {(dayVolume / 1000).toFixed(1)}k lbs
                      </p>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <WorkoutLogItem key={log.id} log={log} onDelete={loadData} />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-border bg-card safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setTab('log')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 min-h-[48px] transition-colors ${
              tab === 'log' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Barbell size={24} />
            <span className="text-xs font-medium">Log</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 min-h-[48px] transition-colors ${
              tab === 'history' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <ClockCounterClockwise size={24} />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
