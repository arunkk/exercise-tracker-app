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
  repsCount: number,
  workoutDate?: string
): Promise<{ rep: Rep; setCount: number }> {
  const supabase = await createClient()
  const day =
    workoutDate?.trim() || new Date().toISOString().split('T')[0]

  // Find or create workout log for this exercise on the chosen date
  let { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', day)
    .maybeSingle()

  if (!log) {
    const { data: newLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({ exercise_id: exerciseId, workout_date: day })
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

/** Sets logged for this exercise on a specific calendar date (YYYY-MM-DD). */
export async function getSetsForExerciseOnDate(
  exerciseId: string,
  date: string
): Promise<Rep[]> {
  const supabase = await createClient()

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('workout_date', date)
    .maybeSingle()

  if (!log) return []

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .eq('workout_log_id', log.id)
    .order('set_number')

  if (error) throw error
  return reps || []
}

/**
 * Most recent session for this exercise strictly before `beforeDate` (YYYY-MM-DD).
 */
export async function getPreviousSessionSets(
  exerciseId: string,
  beforeDate: string
): Promise<Rep[]> {
  const supabase = await createClient()

  const { data: log } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('exercise_id', exerciseId)
    .lt('workout_date', beforeDate)
    .order('workout_date', { ascending: false })
    .limit(1)
    .maybeSingle()

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

