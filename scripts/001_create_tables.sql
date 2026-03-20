-- Exercises table for storing all exercises (both default and custom)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  is_machine BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout logs table for storing exercise sessions
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reps table for storing individual sets within a workout log
CREATE TABLE IF NOT EXISTS reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight_lbs DECIMAL(6,2) NOT NULL,
  rep_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default exercises
INSERT INTO exercises (name, muscle_group, is_machine, is_custom) VALUES
  -- Chest
  ('Bench Press', 'Chest', FALSE, FALSE),
  ('Incline Bench Press', 'Chest', FALSE, FALSE),
  ('Chest Fly Machine', 'Chest', TRUE, FALSE),
  ('Cable Crossover', 'Chest', TRUE, FALSE),
  ('Chest Press Machine', 'Chest', TRUE, FALSE),
  ('Push Ups', 'Chest', FALSE, FALSE),
  
  -- Back
  ('Lat Pulldown', 'Back', TRUE, FALSE),
  ('Seated Row Machine', 'Back', TRUE, FALSE),
  ('Deadlift', 'Back', FALSE, FALSE),
  ('Bent Over Row', 'Back', FALSE, FALSE),
  ('Pull Ups', 'Back', FALSE, FALSE),
  ('Cable Row', 'Back', TRUE, FALSE),
  
  -- Legs
  ('Squat', 'Legs', FALSE, FALSE),
  ('Leg Press', 'Legs', TRUE, FALSE),
  ('Leg Extension', 'Legs', TRUE, FALSE),
  ('Leg Curl', 'Legs', TRUE, FALSE),
  ('Calf Raise Machine', 'Legs', TRUE, FALSE),
  ('Lunges', 'Legs', FALSE, FALSE),
  ('Hip Abductor Machine', 'Legs', TRUE, FALSE),
  ('Hip Adductor Machine', 'Legs', TRUE, FALSE),
  
  -- Arms (Biceps)
  ('Bicep Curl', 'Arms', FALSE, FALSE),
  ('Hammer Curl', 'Arms', FALSE, FALSE),
  ('Preacher Curl Machine', 'Arms', TRUE, FALSE),
  ('Cable Curl', 'Arms', TRUE, FALSE),
  
  -- Arms (Triceps)
  ('Tricep Pushdown', 'Arms', TRUE, FALSE),
  ('Tricep Dip', 'Arms', FALSE, FALSE),
  ('Skull Crushers', 'Arms', FALSE, FALSE),
  ('Tricep Extension Machine', 'Arms', TRUE, FALSE),
  
  -- Shoulders
  ('Overhead Press', 'Shoulders', FALSE, FALSE),
  ('Lateral Raise', 'Shoulders', FALSE, FALSE),
  ('Shoulder Press Machine', 'Shoulders', TRUE, FALSE),
  ('Rear Delt Fly Machine', 'Shoulders', TRUE, FALSE),
  ('Face Pulls', 'Shoulders', TRUE, FALSE),
  
  -- Core
  ('Crunches', 'Core', FALSE, FALSE),
  ('Plank', 'Core', FALSE, FALSE),
  ('Ab Machine', 'Core', TRUE, FALSE),
  ('Cable Crunch', 'Core', TRUE, FALSE),
  ('Russian Twist', 'Core', FALSE, FALSE)
ON CONFLICT DO NOTHING;
