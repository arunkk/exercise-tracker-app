'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dumbbell, History, TrendingUp, RefreshCw } from 'lucide-react'
import type { Exercise, WorkoutLog, MuscleGroup } from '@/lib/types'
import { ExerciseLogger } from './exercise-logger'
import { WorkoutLogItem } from './workout-log-item'
import { getExercises, getWorkoutLogs, analyzeWorkoutPattern } from '@/lib/actions'

type Tab = 'log' | 'history'

export function HomePage() {
  const [tab, setTab] = useState<Tab>('log')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [suggestedMuscleGroups, setSuggestedMuscleGroups] = useState<MuscleGroup[]>(['Chest', 'Back', 'Legs'])
  const [recentPattern, setRecentPattern] = useState<MuscleGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    
    try {
      const [exercisesData, logsData, patternData] = await Promise.all([
        getExercises(),
        getWorkoutLogs(),
        analyzeWorkoutPattern()
      ])
      
      setExercises(exercisesData)
      setWorkoutLogs(logsData)
      setSuggestedMuscleGroups(patternData.suggestedMuscleGroups)
      setRecentPattern(patternData.recentPattern)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])
  
  useEffect(() => {
    loadData()
  }, [loadData])
  
  const handleLogCreated = () => {
    loadData(true)
    // Switch to history to show the new log
    setTab('history')
  }
  
  const todaysLogs = workoutLogs.filter((log) => {
    const today = new Date().toISOString().split('T')[0]
    return log.workout_date === today
  })
  
  const todaysVolume = todaysLogs.reduce((total, log) => {
    return total + (log.reps?.reduce((sum, rep) => sum + rep.weight_lbs * rep.reps_count, 0) || 0)
  }, 0)
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Dumbbell className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">RepTrack</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Today's Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold">{todaysLogs.length}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold">
              {todaysLogs.reduce((sum, log) => sum + (log.reps?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div className="p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold">{(todaysVolume / 1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">Volume (lbs)</p>
          </div>
        </div>
        
        {/* Pattern Indicator */}
        {recentPattern.length > 0 && (
          <div className="mt-3 p-3 bg-primary/10 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Your pattern:</span>
              <div className="flex gap-1">
                {recentPattern.slice(0, 4).map((muscle, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      i === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {muscle.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Suggested next: <span className="text-primary font-medium">{suggestedMuscleGroups[0]}</span>
            </p>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'log' ? (
          <ExerciseLogger
            exercises={exercises}
            suggestedMuscleGroups={suggestedMuscleGroups}
            onLogCreated={handleLogCreated}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {workoutLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No workout logs yet</p>
                <p className="text-sm">Start logging your exercises!</p>
              </div>
            ) : (
              workoutLogs.map((log) => (
                <WorkoutLogItem key={log.id} log={log} onDelete={() => loadData()} />
              ))
            )}
          </div>
        )}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-border bg-card safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setTab('log')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              tab === 'log' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs font-medium">Log</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              tab === 'history' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <History className="w-6 h-6" />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
