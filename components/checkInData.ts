export type SleepQuality = 'Good' | 'Okay' | 'Poor'
export type ActivityLevel =
  | 'Sedentary'
  | 'Not very'
  | 'Light'
  | 'Moderate'
  | 'Very active'
export type MedicationStatus = 'Yes' | 'No' | 'Not applicable'
export type TrackedFactor =
  | 'Feeling'
  | 'Energy'
  | 'Sleep'
  | 'Pain'
  | 'Stress'
  | 'Activity'
  | 'Medication'

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

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function getTodayKey(date = new Date()) {
  return formatDateKey(date)
}

export function getYesterdayKey(date = new Date()) {
  const previousDay = new Date(date)
  previousDay.setDate(previousDay.getDate() - 1)
  return formatDateKey(previousDay)
}

export function formatLongDate(dateKey: string) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateKey: string) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getMonthLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function getGreetingForDate(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 17) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

export function readEntriesFromStorage() {
  if (typeof window === 'undefined') {
    return {} as Record<string, DailyEntry>
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {} as Record<string, DailyEntry>
  }

  try {
    return JSON.parse(raw) as Record<string, DailyEntry>
  } catch {
    return {} as Record<string, DailyEntry>
  }
}

export function writeEntriesToStorage(entries: Record<string, DailyEntry>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getSortedDateKeys(entries: Record<string, DailyEntry>) {
  return Object.keys(entries).sort((a, b) => b.localeCompare(a))
}

export function cloneEntryForDate(entry: DailyEntry, date: string): DailyEntry {
  return {
    ...entry,
    date,
    completedAt: new Date().toISOString(),
  }
}

export function getYesterdayEntry(entries: Record<string, DailyEntry>, todayKey = getTodayKey()) {
  const yesterdayKey = getYesterdayKey(parseDateKey(todayKey))
  return entries[yesterdayKey]
}

export function getMonthlyEntries(entries: Record<string, DailyEntry>, referenceKey = getTodayKey()) {
  const monthPrefix = referenceKey.slice(0, 7)

  return Object.values(entries)
    .filter((entry) => entry.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getMonthlyGrowth(entries: Record<string, DailyEntry>, referenceKey = getTodayKey()) {
  const referenceDate = parseDateKey(referenceKey)
  const completedEntries = getMonthlyEntries(entries, referenceKey)
  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  ).getDate()
  const progress = completedEntries.length / daysInMonth
  const stage = Math.min(5, Math.floor(progress * 6))

  return {
    completedEntries,
    completedDays: completedEntries.length,
    daysInMonth,
    progress,
    stage,
    monthLabel: getMonthLabel(referenceKey),
  }
}

export function getConsecutiveStreak(
  entries: Record<string, DailyEntry>,
  referenceKey = getTodayKey()
) {
  if (!Object.keys(entries).length) {
    return 0
  }

  let streak = 0
  let cursor = parseDateKey(referenceKey)
  const yesterdayKey = getYesterdayKey(parseDateKey(referenceKey))

  if (!entries[referenceKey] && entries[yesterdayKey]) {
    cursor = parseDateKey(yesterdayKey)
  }

  while (true) {
    const key = formatDateKey(cursor)

    if (!entries[key]) {
      break
    }

    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
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
