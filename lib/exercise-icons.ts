/**
 * Retro-styled exercise icon system.
 * Maps exercises to distinctive icons with muscle-group color coding.
 */

/** Retro color palette per muscle group */
export const MUSCLE_GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Chest:     { bg: 'bg-red-900/40',    text: 'text-red-300',    border: 'border-red-700/30' },
  Back:      { bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-700/30' },
  Legs:      { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700/30' },
  Hips:      { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700/30' },
  Arms:      { bg: 'bg-amber-900/40',  text: 'text-amber-300',  border: 'border-amber-700/30' },
  Shoulders: { bg: 'bg-cyan-900/40',   text: 'text-cyan-300',   border: 'border-cyan-700/30' },
  Core:      { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-700/30' },
}

const DEFAULT_COLORS = { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' }

/**
 * Exercise name → icon mapping.
 * Uses keywords in the exercise name for fuzzy matching.
 */
const ICON_MAP: [string[], string][] = [
  // Chest
  [['bench press'],           '🏋️'],
  [['incline bench'],         '📐'],
  [['push up', 'pushup'],     '🫸'],
  [['cable crossover'],       '✖️'],
  [['chest fly', 'pec fly'],  '🦅'],
  [['chest press'],           '🏋️'],
  [['dumbbell press'],        '🏋️'],

  // Back
  [['deadlift'],              '⚡'],
  [['pull up', 'pullup', 'chin up'], '⬆️'],
  [['row', 'cable row', 'bent over'], '🚣'],
  [['lat pulldown'],          '⬇️'],

  // Arms
  [['bicep curl', 'cable curl', 'preacher curl', 'hammer curl'], '💪'],
  [['skull crush'],           '💀'],
  [['tricep dip', 'dip'],     '🔻'],
  [['tricep push', 'pushdown'], '⏬'],
  [['tricep ext'],            '🔧'],

  // Legs
  [['squat'],                 '🏋️'],
  [['leg press'],             '🦿'],
  [['leg curl'],              '🔄'],
  [['leg ext'],               '🦵'],
  [['lunge', 'split squat'],  '🚶'],
  [['calf raise', 'calf'],    '🦶'],

  // Hips
  [['hip thrust', 'glute'],   '🍑'],
  [['hip abduct'],            '↔️'],
  [['hip adduct'],            '↕️'],
  [['sumo'],                  '⚡'],
  [['kickback'],              '🦵'],

  // Shoulders
  [['overhead press', 'ohp', 'shoulder press'], '⬆️'],
  [['lateral raise', 'lat raise'], '↗️'],
  [['face pull'],             '🎯'],
  [['rear delt', 'reverse fly'], '🦅'],

  // Core
  [['plank'],                 '📏'],
  [['crunch', 'ab machine'],  '🔥'],
  [['russian twist', 'twist'], '🌀'],
]

/**
 * Get the icon character for a given exercise name.
 * Falls back to muscle-group defaults.
 */
export function getExerciseIcon(name: string, muscleGroup: string, isMachine: boolean): string {
  const lower = name.toLowerCase()

  for (const [keywords, icon] of ICON_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return icon
    }
  }

  // Fallback by muscle group
  const fallbacks: Record<string, string> = {
    Chest: '🏋️',
    Back: '🔙',
    Legs: '🦵',
    Hips: '🍑',
    Arms: '💪',
    Shoulders: '🏔️',
    Core: '🔥',
  }

  return fallbacks[muscleGroup] || (isMachine ? '⚙️' : '🏋️')
}

export function getGroupColors(muscleGroup: string) {
  return MUSCLE_GROUP_COLORS[muscleGroup] || DEFAULT_COLORS
}
