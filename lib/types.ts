export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Arms' | 'Shoulders' | 'Core'

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  is_machine: boolean
  image_url: string | null
  is_custom: boolean
  created_at: string
}

export interface Rep {
  id: string
  workout_log_id: string
  weight_lbs: number
  reps_count: number
  set_number: number
  created_at: string
}

export interface WorkoutLog {
  id: string
  exercise_id: string
  workout_date: string
  notes: string | null
  created_at: string
  exercise?: Exercise
  reps?: Rep[]
}

export interface SetInput {
  weight_lbs: number
  reps_count: number
}
