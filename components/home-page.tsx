'use client'

import { useState, useEffect, useCallback } from 'react'
import { Barbell, ClockCounterClockwise, Fire, ListBullets, TrendUp } from '@phosphor-icons/react'
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
      total + (log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.rep_count, 0) || 0),
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
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Barbell size={28} className="text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-5 pb-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg tracking-tight">RepTrack</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="stat-glow bg-card rounded-xl px-3 py-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Fire size={14} weight="fill" className="text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exercises</span>
            </div>
            <p className="text-xl font-extrabold tracking-tight">{todaysExercises}</p>
          </div>
          <div className="stat-glow bg-card rounded-xl px-3 py-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ListBullets size={14} weight="bold" className="text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sets</span>
            </div>
            <p className="text-xl font-extrabold tracking-tight">{todaysSets}</p>
          </div>
          <div className="stat-glow bg-card rounded-xl px-3 py-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendUp size={14} weight="bold" className="text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</span>
            </div>
            <p className="text-xl font-extrabold tracking-tight">
              {todaysVolume >= 1000 ? `${(todaysVolume / 1000).toFixed(1)}k` : todaysVolume}
            </p>
          </div>
        </div>
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
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <ClockCounterClockwise size={28} className="opacity-50" />
                </div>
                <p className="font-semibold text-foreground">No workouts yet</p>
                <p className="text-sm mt-1">Your logged exercises will appear here</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, logs]) => {
                const dayExercises = logs.length
                const daySets = logs.reduce((s, l) => s + (l.reps?.length || 0), 0)
                const dayVolume = logs.reduce(
                  (t, l) => t + (l.reps?.reduce((s, r) => s + r.weight_lbs * r.rep_count, 0) || 0),
                  0
                )
                return (
                  <div key={date} className="mb-5">
                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2.5 z-10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {formatDateLabel(date)}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {dayExercises} ex · {daySets} sets · {(dayVolume / 1000).toFixed(1)}k lbs
                        </p>
                      </div>
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
      <nav className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-md safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setTab('log')}
            className={`relative flex-1 flex flex-col items-center py-3 gap-1 min-h-[52px] transition-colors ${
              tab === 'log' ? 'text-primary nav-active' : 'text-muted-foreground'
            }`}
          >
            <Barbell size={24} weight={tab === 'log' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Log</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`relative flex-1 flex flex-col items-center py-3 gap-1 min-h-[52px] transition-colors ${
              tab === 'history' ? 'text-primary nav-active' : 'text-muted-foreground'
            }`}
          >
            <ClockCounterClockwise size={24} weight={tab === 'history' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
