export type SleepQuality = 'Good' | 'Okay' | 'Poor'
export type ActivityLevel =
  | 'Sedentary'
  | 'Not very'
  | 'Light'
  | 'Moderate'
  | 'Very active'
export type MedicationStatus = 'Yes' | 'No' | 'Not applicable'

export interface DailyEntry {
  date: string
  feeling: number
  energy: number
  sleep: SleepQuality
  painLevel: number | null
  stress: number
  activity: ActivityLevel
  medication: MedicationStatus
  completedAt: string
}

export const STORAGE_KEY = 'holistiq-daily-entries'

export const FEELING_OPTIONS = [
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 2, label: 'Low', emoji: '😞' },
  { value: 1, label: 'Rough', emoji: '😫' },
] as const

export const ENERGY_LABELS = ['Terrible', 'Bad', 'Neutral', 'Good', 'Great'] as const
export const STRESS_LABELS = ['Very low', 'Low', 'Moderate', 'High', 'Very high'] as const
export const SLEEP_OPTIONS: SleepQuality[] = ['Good', 'Okay', 'Poor']
export const ACTIVITY_OPTIONS: ActivityLevel[] = [
  'Sedentary',
  'Not very',
  'Light',
  'Moderate',
  'Very active',
]
export const MEDICATION_OPTIONS: MedicationStatus[] = ['Yes', 'No', 'Not applicable']

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function formatLongDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function emptyEntry(date: string): DailyEntry {
  return {
    date,
    feeling: 3,
    energy: 3,
    sleep: 'Okay',
    painLevel: 4,
    stress: 3,
    activity: 'Light',
    medication: 'Not applicable',
    completedAt: new Date().toISOString(),
  }
}
