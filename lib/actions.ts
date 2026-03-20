'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Exercise, WorkoutLog, SetInput, MuscleGroup, Rep } from './types'

export async function getExercises(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name')
  
  if (error) throw error
  return data || []
}

export async function getWorkoutLogs(
  limit = 20,
  offset = 0
): Promise<{ data: WorkoutLog[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      exercise:exercises(*),
      reps(*)
    `)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  if (error) throw error

  return {
    data: data || [],
    hasMore: (data?.length || 0) > limit,
  }
}

export async function createExercise(
  name: string,
  muscleGroup: MuscleGroup,
  imageUrl: string | null,
  isMachine: boolean = false
): Promise<Exercise> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name,
      muscle_group: muscleGroup,
      image_url: imageUrl,
      is_machine: isMachine,
      is_custom: true
    })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/')
  return data
}

export async function deleteWorkoutLog(logId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', logId)

  if (error) throw error

  revalidatePath('/')
}

export async function logSet(
  exerciseId: string,
  weightLbs: number,
  repsCount: number
): Promise<{ rep: Rep; setCount: number }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find or create today's workout log for this exercise
  let { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', today)
    .single()

  if (!log) {
    const { data: newLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({ exercise_id: exerciseId, workout_date: today })
      .select('id')
      .single()
    if (logError) throw logError
    log = newLog
  }

  // Get next set number
  const { count } = await supabase
    .from('reps')
    .select('*', { count: 'exact', head: true })
    .eq('workout_log_id', log!.id)

  const setNumber = (count || 0) + 1

  // Insert the rep
  const { data: rep, error: repError } = await supabase
    .from('reps')
    .insert({
      workout_log_id: log!.id,
      weight_lbs: weightLbs,
      rep_count: repsCount,
      set_number: setNumber,
    })
    .select()
    .single()

  if (repError) throw repError

  revalidatePath('/')
  return { rep, setCount: setNumber }
}

export async function deleteSet(repId: string): Promise<void> {
  const supabase = await createClient()

  const { data: rep } = await supabase
    .from('reps')
    .select('workout_log_id')
    .eq('id', repId)
    .single()

  if (!rep) throw new Error('Set not found')

  const { error } = await supabase.from('reps').delete().eq('id', repId)
  if (error) throw error

  const { count } = await supabase
    .from('reps')
    .select('*', { count: 'exact', head: true })
    .eq('workout_log_id', rep.workout_log_id)

  if (count === 0) {
    await supabase.from('workout_logs').delete().eq('id', rep.workout_log_id)
  }

  revalidatePath('/')
}

export async function getTodaySets(exerciseId: string): Promise<Rep[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', today)
    .single()

  if (!log) return []

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .eq('workout_log_id', log.id)
    .order('set_number')

  if (error) throw error
  return reps || []
}

export async function getLastSessionSets(exerciseId: string): Promise<Rep[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .lt('workout_date', today)
    .order('workout_date', { ascending: false })
    .limit(1)
    .single()

  if (!log) return []

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .eq('workout_log_id', log.id)
    .order('set_number')
    .limit(5)

  if (error) throw error
  return reps || []
}

export interface PatternAnalysis {
  suggestedMuscleGroups: MuscleGroup[]
  recentPattern: MuscleGroup[]
  confidence: number
}

export async function analyzeWorkoutPattern(): Promise<PatternAnalysis> {
  const supabase = await createClient()
  
  // Get last 14 workout logs to detect pattern
  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select(`
      workout_date,
      exercise:exercises(muscle_group)
    `)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)
  
  if (error || !logs || logs.length === 0) {
    return {
      suggestedMuscleGroups: ['Chest', 'Back', 'Legs'],
      recentPattern: [],
      confidence: 0
    }
  }
  
  // Group by workout date to get muscle groups per day
  const dayMuscleGroups: Map<string, Set<MuscleGroup>> = new Map()
  
  for (const log of logs) {
    const date = log.workout_date
    const muscleGroup = (log.exercise as { muscle_group: MuscleGroup })?.muscle_group
    
    if (!dayMuscleGroups.has(date)) {
      dayMuscleGroups.set(date, new Set())
    }
    dayMuscleGroups.get(date)!.add(muscleGroup)
  }
  
  // Convert to array of primary muscle groups per day (most common for that day)
  const dailyPattern: MuscleGroup[] = Array.from(dayMuscleGroups.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
    .map(([, muscles]) => {
      // Get the first muscle group for that day (simplified)
      return Array.from(muscles)[0]
    })
    .slice(0, 7) // Last 7 workout days
  
  // Detect repeating patterns (2-4 day cycles)
  let bestPattern: MuscleGroup[] = []
  let bestConfidence = 0
  
  for (let cycleLength = 2; cycleLength <= 4; cycleLength++) {
    if (dailyPattern.length >= cycleLength * 2) {
      const cycle = dailyPattern.slice(0, cycleLength)
      let matches = 0
      let total = 0
      
      for (let i = cycleLength; i < dailyPattern.length; i++) {
        const expectedIndex = i % cycleLength
        if (dailyPattern[i] === cycle[expectedIndex]) {
          matches++
        }
        total++
      }
      
      const confidence = total > 0 ? matches / total : 0
      if (confidence > bestConfidence) {
        bestConfidence = confidence
        bestPattern = cycle
      }
    }
  }
  
  // Predict next muscle group based on pattern
  let suggestedMuscleGroups: MuscleGroup[]
  
  if (bestConfidence >= 0.5 && bestPattern.length > 0) {
    // Use detected pattern to predict
    const lastMuscleGroup = dailyPattern[0]
    const lastIndex = bestPattern.indexOf(lastMuscleGroup)
    const nextIndex = (lastIndex + 1) % bestPattern.length
    
    // Suggest the next in cycle, plus variations
    suggestedMuscleGroups = [
      bestPattern[nextIndex],
      ...bestPattern.filter(m => m !== bestPattern[nextIndex])
    ].slice(0, 3)
  } else {
    // No clear pattern, suggest based on what hasn't been done recently
    const allMuscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']
    const recentMuscles = new Set(dailyPattern.slice(0, 2))
    
    suggestedMuscleGroups = allMuscleGroups
      .filter(m => !recentMuscles.has(m))
      .slice(0, 3)
    
    if (suggestedMuscleGroups.length < 3) {
      suggestedMuscleGroups = allMuscleGroups.slice(0, 3)
    }
  }
  
  return {
    suggestedMuscleGroups,
    recentPattern: dailyPattern.slice(0, 5),
    confidence: bestConfidence
  }
}
