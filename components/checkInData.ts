export const FACTOR_CONFIG = [
  { key: 'pain', label: 'Pain', color: '#be6a4c' },
  { key: 'mental', label: 'Mental Health', color: '#6d8f5d' },
  { key: 'social', label: 'Social', color: '#8e7dbd' },
  { key: 'lifestyle', label: 'Lifestyle', color: '#d09045' },
  { key: 'diet', label: 'Diet', color: '#6ea06c' },
  { key: 'environment', label: 'Environment', color: '#73a8a4' },
  { key: 'medication', label: 'Medication', color: '#618bc0' },
  { key: 'activity', label: 'Activity', color: '#c27d8d' },
] as const

export const FACTOR_ORDER = FACTOR_CONFIG.map((factor) => factor.key)

export type FactorKey = (typeof FACTOR_CONFIG)[number]['key']
export type CheckInPeriod = 'morning' | 'night' | 'weekly'
export type SubstanceFrequency = 'None' | '1-3 times' | '3-5 times' | '5+ times'
export type NegativeFeeling = 'Sad' | 'Lonely' | 'Angry' | 'Discouraged' | 'Hurt'
export type AnswerValue = number | string | string[] | SubstanceUseAnswer

export interface SubstanceUseAnswer {
  substances: string[]
  customSubstance: string
  frequency: SubstanceFrequency
}

export interface CheckInSession {
  id: string
  date: string
  weekKey: string
  period: CheckInPeriod
  answers: Record<string, AnswerValue>
  completedAt: string
}

export interface FactorObservation {
  factor: FactorKey
  score: number
  weight: number
  source: string
}

export interface FactorScoreSummary {
  factorScores: Record<FactorKey, number>
  totalScore: number
  observations: FactorObservation[]
}

export interface TrendPoint {
  label: string
  periodKey: string
  factorScores: Record<FactorKey, number>
  totalScore: number
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
  streak: number
  checkedInToday: boolean
  lastCheckInAt: string
}

export interface PrivacySettings {
  shareGraphsWithFamily: boolean
  sharedFamilyMemberIds: string[]
}

export interface ReminderSettings {
  nightReminderEnabled: boolean
  nightReminderHour: number
  familyNudgesEnabled: boolean
  nightReminderLastSentDate: string | null
  familyNudgeLastSentAt: string | null
}

export interface ConnectedAppSnapshot {
  date: string
  myFitnessPal: {
    sodiumMg: number
    targetSodiumMg: number
    produceServings: number
  }
  wearable: {
    steps: number
    activeMinutes: number
    sleepHours: number
  }
  medicationTracker: {
    adherencePercent: number
  }
  environmentJournal: {
    calmnessScore: number
  }
}

export interface WellnessState {
  sessions: Record<string, CheckInSession>
  reminders: ReminderSettings
  privacy: PrivacySettings
  familyMembers: FamilyMember[]
  connectedApps: ConnectedAppSnapshot[]
}

export interface BaseQuestion {
  id: string
  period: CheckInPeriod
  prompt: string
  helper?: string
  primaryFactor: FactorKey
  factors: FactorKey[]
  sortOrder: number
  visibleWhen?: (answers: Record<string, AnswerValue>) => boolean
  score: (answer: AnswerValue, answers: Record<string, AnswerValue>) => FactorObservation[]
}

export interface SliderQuestionDefinition extends BaseQuestion {
  kind: 'slider'
  min: number
  max: number
  ticks: string[]
}

export interface SingleChoiceQuestionDefinition extends BaseQuestion {
  kind: 'single_choice'
  options: string[]
}

export interface MultiSelectQuestionDefinition extends BaseQuestion {
  kind: 'multi_select'
  options: string[]
}

export interface SubstanceUseQuestionDefinition extends BaseQuestion {
  kind: 'substance_use'
  options: string[]
  frequencyOptions: SubstanceFrequency[]
}

export type QuestionDefinition =
  | SliderQuestionDefinition
  | SingleChoiceQuestionDefinition
  | MultiSelectQuestionDefinition
  | SubstanceUseQuestionDefinition

export const STORAGE_KEY = 'holistiq-wellness-state-v2'
export const DEFAULT_CHECK_IN_TIME_ZONE = 'America/New_York'

const DEFAULT_REMINDERS: ReminderSettings = {
  nightReminderEnabled: true,
  nightReminderHour: 20,
  familyNudgesEnabled: true,
  nightReminderLastSentDate: null,
  familyNudgeLastSentAt: null,
}

const DEFAULT_PRIVACY: PrivacySettings = {
  shareGraphsWithFamily: false,
  sharedFamilyMemberIds: [],
}

const SUBSTANCE_RISK: Array<{ keywords: string[]; score: number }> = [
  { keywords: ['nicotine', 'vape', 'cigarette'], score: 45 },
  { keywords: ['marijuana', 'cannabis', 'weed'], score: 55 },
  { keywords: ['pain killer', 'painkiller', 'opioid', 'oxycodone', 'morphine'], score: 20 },
  { keywords: ['cocaine', 'meth', 'heroin', 'fentanyl'], score: 5 },
  { keywords: ['alcohol'], score: 50 },
]

const NEGATIVE_FEELING_IMPACTS: Record<NegativeFeeling, Array<{ factor: FactorKey; penalty: number }>> = {
  Sad: [{ factor: 'mental', penalty: 18 }],
  Lonely: [
    { factor: 'mental', penalty: 14 },
    { factor: 'social', penalty: 18 },
  ],
  Angry: [
    { factor: 'mental', penalty: 15 },
    { factor: 'environment', penalty: 8 },
  ],
  Discouraged: [
    { factor: 'mental', penalty: 16 },
    { factor: 'lifestyle', penalty: 8 },
  ],
  Hurt: [
    { factor: 'mental', penalty: 10 },
    { factor: 'pain', penalty: 14 },
  ],
}

const MORNING_FEELING_TICKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const WEEKLY_MENTAL_TICKS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const PAIN_TICKS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  }
}

export function getGreetingForHour(hour: number) {
  if (hour >= 4 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function getResolvedCheckInTimeZone(timeZone?: string | null) {
  return timeZone?.trim() ? timeZone : DEFAULT_CHECK_IN_TIME_ZONE
}

export function getDailyCheckInContext(
  date = new Date(),
  requestedTimeZone?: string | null
) {
  const timeZone = getResolvedCheckInTimeZone(requestedTimeZone)
  const { year, month, day, hour } = getTimeZoneParts(date, timeZone)
  const currentDateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const previousDate = new Date(Date.UTC(year, month - 1, day, 12))
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  const activePeriod: 'morning' | 'night' = new Date().getHours() >= 4 && new Date().getHours() < 12 ? 'morning' : 'night'

  return {
    timeZone,
    hour,
    activePeriod,
    activeDateKey: hour < 6 ? formatUtcDateKey(previousDate) : currentDateKey,
  }
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const offset = day === 0 ? -6 : 1 - day
  nextDate.setDate(nextDate.getDate() + offset)
  nextDate.setHours(12, 0, 0, 0)
  return nextDate
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date)
  nextDate.setDate(nextDate.getDate() + 6)
  return nextDate
}

function normalizeScore(value: number, min: number, max: number) {
  if (max === min) {
    return 50
  }

  return clampScore(((value - min) / (max - min)) * 100)
}

function invertScore(value: number, min: number, max: number) {
  return 100 - normalizeScore(value, min, max)
}

function createObservations(
  score: number,
  factors: Array<{ factor: FactorKey; weight: number }>,
  source: string
) {
  return factors.map(({ factor, weight }) => ({
    factor,
    score: clampScore(score),
    weight,
    source,
  }))
}

function dampenedPenalty(values: number[]) {
  return values
    .slice()
    .sort((a, b) => Math.abs(b) - Math.abs(a))
    .reduce((total, value, index) => total + value * Math.pow(0.65, index), 0)
}

function getChoiceScore(answer: string, options: readonly string[]) {
  const answerIndex = options.indexOf(answer)

  if (answerIndex === -1) {
    return 50
  }

  return normalizeScore(answerIndex, 0, Math.max(1, options.length - 1))
}

function getCustomSubstanceScore(customSubstance: string) {
  if (!customSubstance.trim()) {
    return 70
  }

  const lowered = customSubstance.toLowerCase()
  const match = SUBSTANCE_RISK.find((entry) =>
    entry.keywords.some((keyword) => lowered.includes(keyword))
  )

  return match?.score ?? 40
}

function substanceFrequencyScore(frequency: SubstanceFrequency) {
  switch (frequency) {
    case 'None':
      return 100
    case '1-3 times':
      return 70
    case '3-5 times':
      return 45
    case '5+ times':
      return 20
  }
}

function scoreNegativeFeelings(selectedFeelings: string[]) {
  const penaltiesByFactor = new Map<FactorKey, number[]>()

  for (const item of selectedFeelings) {
    const impacts = NEGATIVE_FEELING_IMPACTS[item as NegativeFeeling]

    if (!impacts) {
      continue
    }

    for (const impact of impacts) {
      const current = penaltiesByFactor.get(impact.factor) ?? []
      current.push(impact.penalty)
      penaltiesByFactor.set(impact.factor, current)
    }
  }

  return Array.from(penaltiesByFactor.entries()).map(([factor, penalties]) => ({
    factor,
    score: clampScore(100 - dampenedPenalty(penalties)),
    weight: 1.1,
    source: 'Weekly feelings follow-up',
  }))
}

function scoreConnectedApps(snapshot: ConnectedAppSnapshot) {
  const sodiumDelta = Math.max(0, snapshot.myFitnessPal.sodiumMg - snapshot.myFitnessPal.targetSodiumMg)
  const dietScore = clampScore(
    82 - sodiumDelta / 40 + snapshot.myFitnessPal.produceServings * 4
  )
  const activityScore = clampScore(
    normalizeScore(snapshot.wearable.steps, 2500, 11000) * 0.55 +
      normalizeScore(snapshot.wearable.activeMinutes, 10, 65) * 0.45
  )
  const lifestyleScore = clampScore(
    normalizeScore(snapshot.wearable.sleepHours, 4.5, 8.5) * 0.55 +
      normalizeScore(snapshot.wearable.activeMinutes, 10, 65) * 0.45
  )
  const medicationScore = clampScore(snapshot.medicationTracker.adherencePercent)
  const environmentScore = clampScore(snapshot.environmentJournal.calmnessScore)

  return [
    { factor: 'diet', score: dietScore, weight: 0.8, source: 'MyFitnessPal' },
    { factor: 'activity', score: activityScore, weight: 0.7, source: 'Wearable activity' },
    { factor: 'lifestyle', score: lifestyleScore, weight: 0.6, source: 'Wearable routine' },
    { factor: 'medication', score: medicationScore, weight: 0.7, source: 'Medication tracker' },
    { factor: 'environment', score: environmentScore, weight: 0.5, source: 'Environment journal' },
  ] satisfies FactorObservation[]
}

function scoreMorningFeeling(answer: AnswerValue) {
  const score = normalizeScore(Number(answer), 1, 10)
  return createObservations(
    score,
    [
      { factor: 'mental', weight: 1.3 },
      { factor: 'lifestyle', weight: 0.4 },
    ],
    'How are you feeling today?'
  )
}

function scoreEnergy(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), ENERGY_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'lifestyle', weight: 1.1 },
      { factor: 'activity', weight: 0.4 },
      { factor: 'mental', weight: 0.35 },
    ],
    'How is your energy?'
  )
}

function scoreSleep(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), SLEEP_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'lifestyle', weight: 1.1 },
      { factor: 'environment', weight: 0.4 },
      { factor: 'mental', weight: 0.3 },
    ],
    'How was your sleep?'
  )
}

function scorePain(answer: AnswerValue) {
  const score = invertScore(Number(answer), 0, 10)
  return createObservations(
    score,
    [
      { factor: 'pain', weight: 1.3 },
      { factor: 'mental', weight: 0.35 },
    ],
    'How intense was your pain today?'
  )
}

function scoreStress(answer: AnswerValue) {
  const score = invertScore(Number(answer), 1, 10)
  return createObservations(
    score,
    [
      { factor: 'mental', weight: 1.1 },
      { factor: 'environment', weight: 0.35 },
      { factor: 'lifestyle', weight: 0.3 },
    ],
    'How stressful did the day feel?'
  )
}

function scoreSocialConnection(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), SOCIAL_CONNECTION_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'social', weight: 1.2 },
      { factor: 'mental', weight: 0.35 },
    ],
    'How connected did you feel to other people today?'
  )
}

function scoreRoutine(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), ROUTINE_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'lifestyle', weight: 1.15 },
      { factor: 'mental', weight: 0.25 },
    ],
    'How well did your routine support you today?'
  )
}

function scoreMeals(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), MEAL_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'diet', weight: 1.2 },
      { factor: 'lifestyle', weight: 0.3 },
    ],
    'How balanced were your meals today?'
  )
}

function scoreEnvironment(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), ENVIRONMENT_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'environment', weight: 1.15 },
      { factor: 'mental', weight: 0.25 },
    ],
    'How comfortable and calm did your environment feel today?'
  )
}

function scoreMedication(answer: AnswerValue) {
  const options = ['No', 'Partly', 'Yes', 'Not applicable']
  let score = getChoiceScore(String(answer), options)

  if (answer === 'Not applicable') {
    score = 80
  }

  return createObservations(
    score,
    [
      { factor: 'medication', weight: 1.2 },
      { factor: 'lifestyle', weight: 0.2 },
    ],
    'Did you take your medications as planned today?'
  )
}

function scoreActivity(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), ACTIVITY_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'activity', weight: 1.2 },
      { factor: 'lifestyle', weight: 0.35 },
    ],
    'How active were you today?'
  )
}

function scoreWeeklySocialize(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_SOCIALIZE_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'social', weight: 1.1 },
      { factor: 'mental', weight: 0.2 },
    ],
    'How much did you socialize this week?'
  )
}

function scoreSubstanceUse(answer: AnswerValue) {
  const parsedAnswer = answer as SubstanceUseAnswer
  const baseScore = substanceFrequencyScore(parsedAnswer.frequency)
  const selectedSubstanceScores = parsedAnswer.substances.length
    ? parsedAnswer.substances.map((substance) => getCustomSubstanceScore(substance))
    : [100]
  const customScore = getCustomSubstanceScore(parsedAnswer.customSubstance)
  const overallScore = clampScore(average([...selectedSubstanceScores, customScore, baseScore]))

  return createObservations(
    overallScore,
    [
      { factor: 'lifestyle', weight: 1.1 },
      { factor: 'mental', weight: 0.35 },
      { factor: 'pain', weight: 0.25 },
    ],
    'Recreational substance use'
  )
}

function scoreWeeklyMentalHealth(answer: AnswerValue) {
  const score = normalizeScore(Number(answer), 0, 10)
  return createObservations(
    score,
    [
      { factor: 'mental', weight: 1.35 },
      { factor: 'social', weight: 0.15 },
    ],
    'How would you rate your mental health this week?'
  )
}

function scoreWeeklyTimeWithOthers(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_TIME_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'social', weight: 1.1 },
      { factor: 'mental', weight: 0.2 },
    ],
    'How much time did you spend with family and friends?'
  )
}

function scoreWeeklyPain(answer: AnswerValue) {
  const score = normalizeScore(Number(answer), 0, 10)
  return createObservations(score, [{ factor: 'pain', weight: 1.2 }], 'How manageable was your pain this week?')
}

function scoreWeeklyRoutine(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_ROUTINE_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'lifestyle', weight: 1.15 },
      { factor: 'mental', weight: 0.2 },
    ],
    'How regular was your daily routine this week?'
  )
}

function scoreWeeklyFood(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_FOOD_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'diet', weight: 1.15 },
      { factor: 'lifestyle', weight: 0.2 },
    ],
    'How often did your food choices support your health goals this week?'
  )
}

function scoreWeeklyEnvironment(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_ENVIRONMENT_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'environment', weight: 1.15 },
      { factor: 'mental', weight: 0.2 },
    ],
    'How often did your environment help you feel settled this week?'
  )
}

function scoreWeeklyMedication(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_MEDICATION_OPTIONS)
  return createObservations(score, [{ factor: 'medication', weight: 1.2 }], 'How consistent were you with medications or care routines this week?')
}

function scoreWeeklyMovement(answer: AnswerValue) {
  const score = getChoiceScore(String(answer), WEEKLY_MOVEMENT_OPTIONS)
  return createObservations(
    score,
    [
      { factor: 'activity', weight: 1.15 },
      { factor: 'lifestyle', weight: 0.25 },
    ],
    'How often did you intentionally move your body this week?'
  )
}

export const ENERGY_OPTIONS = ['Terrible', 'Bad', 'Neutral', 'Good', 'Great'] as const
export const SLEEP_OPTIONS = ['Terrible', 'Bad', 'Neutral', 'Good', 'Great'] as const
export const SOCIAL_CONNECTION_OPTIONS = [
  'Not at all connected',
  'A little connected',
  'Moderately connected',
  'Very connected',
] as const
export const ROUTINE_OPTIONS = ['Off track', 'Uneven', 'Okay', 'Strong'] as const
export const MEAL_OPTIONS = ['Not at all balanced', 'A little balanced', 'Mostly balanced', 'Very balanced'] as const
export const ENVIRONMENT_OPTIONS = ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent'] as const
export const ACTIVITY_OPTIONS = ['None', 'Light', 'Moderate', 'High'] as const
export const WEEKLY_SOCIALIZE_OPTIONS = ['None', 'Very little', 'Some', 'A lot'] as const
export const WEEKLY_TIME_OPTIONS = ['None', '1-3 hours', '3-5 hours', '5+ hours'] as const
export const WEEKLY_ROUTINE_OPTIONS = ['Not regular', 'Slightly regular', 'Moderately regular', 'Very regular'] as const
export const WEEKLY_FOOD_OPTIONS = ['Rarely', 'Sometimes', 'Often', 'Almost always'] as const
export const WEEKLY_ENVIRONMENT_OPTIONS = ['Never', 'Sometimes', 'Often', 'Almost always'] as const
export const WEEKLY_MEDICATION_OPTIONS = ['Not at all', 'Some days', 'Most days', 'Every day'] as const
export const WEEKLY_MOVEMENT_OPTIONS = ['0 days', '1-2 days', '3-4 days', '5+ days'] as const
export const NEGATIVE_FEELING_OPTIONS = ['Sad', 'Lonely', 'Angry', 'Discouraged', 'Hurt'] as const
export const SUBSTANCE_OPTIONS = ['Nicotine', 'Marijuana', 'Pain killers'] as const

export const QUESTION_BANK: QuestionDefinition[] = [
  {
    id: 'morning_feeling',
    period: 'morning',
    kind: 'slider',
    prompt: 'How are you feeling today?',
    helper: 'Choose a number from 1 to 10.',
    primaryFactor: 'mental',
    factors: ['mental', 'lifestyle'],
    min: 1,
    max: 10,
    ticks: [...MORNING_FEELING_TICKS],
    sortOrder: 0,
    score: scoreMorningFeeling,
  },
  {
    id: 'morning_energy',
    period: 'morning',
    kind: 'single_choice',
    prompt: 'How is your energy?',
    primaryFactor: 'lifestyle',
    factors: ['lifestyle', 'activity', 'mental'],
    options: [...ENERGY_OPTIONS],
    sortOrder: 1,
    score: scoreEnergy,
  },
  {
    id: 'morning_sleep',
    period: 'morning',
    kind: 'single_choice',
    prompt: 'How was your sleep?',
    primaryFactor: 'lifestyle',
    factors: ['lifestyle', 'environment', 'mental'],
    options: [...SLEEP_OPTIONS],
    sortOrder: 2,
    score: scoreSleep,
  },
  {
    id: 'night_pain',
    period: 'night',
    kind: 'slider',
    prompt: 'How intense was your pain today?',
    helper: '0 means no pain. 10 means the worst pain today.',
    primaryFactor: 'pain',
    factors: ['pain', 'mental'],
    min: 0,
    max: 10,
    ticks: [...PAIN_TICKS],
    sortOrder: 0,
    score: scorePain,
  },
  {
    id: 'night_stress',
    period: 'night',
    kind: 'slider',
    prompt: 'How stressful did the day feel?',
    helper: '1 means very calm. 10 means extremely stressful.',
    primaryFactor: 'mental',
    factors: ['mental', 'environment', 'lifestyle'],
    min: 1,
    max: 10,
    ticks: [...MORNING_FEELING_TICKS],
    sortOrder: 1,
    score: scoreStress,
  },
  {
    id: 'night_social_connection',
    period: 'night',
    kind: 'single_choice',
    prompt: 'How connected did you feel to other people today?',
    primaryFactor: 'social',
    factors: ['social', 'mental'],
    options: [...SOCIAL_CONNECTION_OPTIONS],
    sortOrder: 2,
    score: scoreSocialConnection,
  },
  {
    id: 'night_routine',
    period: 'night',
    kind: 'single_choice',
    prompt: 'How well did your routine support you today?',
    primaryFactor: 'lifestyle',
    factors: ['lifestyle', 'mental'],
    options: [...ROUTINE_OPTIONS],
    sortOrder: 3,
    score: scoreRoutine,
  },
  {
    id: 'night_meals',
    period: 'night',
    kind: 'single_choice',
    prompt: 'How balanced were your meals today?',
    primaryFactor: 'diet',
    factors: ['diet', 'lifestyle'],
    options: [...MEAL_OPTIONS],
    sortOrder: 4,
    score: scoreMeals,
  },
  {
    id: 'night_environment',
    period: 'night',
    kind: 'single_choice',
    prompt: 'How comfortable and calm did your environment feel today?',
    primaryFactor: 'environment',
    factors: ['environment', 'mental'],
    options: [...ENVIRONMENT_OPTIONS],
    sortOrder: 5,
    score: scoreEnvironment,
  },
  {
    id: 'night_medication',
    period: 'night',
    kind: 'single_choice',
    prompt: 'Did you take your medications as planned today?',
    primaryFactor: 'medication',
    factors: ['medication', 'lifestyle'],
    options: ['No', 'Partly', 'Yes', 'Not applicable'],
    sortOrder: 6,
    score: scoreMedication,
  },
  {
    id: 'night_activity',
    period: 'night',
    kind: 'single_choice',
    prompt: 'How active were you today?',
    primaryFactor: 'activity',
    factors: ['activity', 'lifestyle'],
    options: [...ACTIVITY_OPTIONS],
    sortOrder: 7,
    score: scoreActivity,
  },
  {
    id: 'weekly_socialize',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How much did you socialize this week?',
    primaryFactor: 'social',
    factors: ['social', 'mental'],
    options: [...WEEKLY_SOCIALIZE_OPTIONS],
    sortOrder: 2,
    score: scoreWeeklySocialize,
  },
  {
    id: 'weekly_substances',
    period: 'weekly',
    kind: 'substance_use',
    prompt: 'Were there any recreational non-prescribed substances used this week?',
    helper: 'Select all that apply and then choose the frequency.',
    primaryFactor: 'lifestyle',
    factors: ['lifestyle', 'mental', 'pain'],
    options: [...SUBSTANCE_OPTIONS],
    frequencyOptions: ['None', '1-3 times', '3-5 times', '5+ times'],
    sortOrder: 3,
    score: scoreSubstanceUse,
  },
  {
    id: 'weekly_mental_health',
    period: 'weekly',
    kind: 'slider',
    prompt: 'How would you rate your mental health this week?',
    helper: 'Choose a number from 0 to 10.',
    primaryFactor: 'mental',
    factors: ['mental', 'social'],
    min: 0,
    max: 10,
    ticks: [...WEEKLY_MENTAL_TICKS],
    sortOrder: 1,
    score: scoreWeeklyMentalHealth,
  },
  {
    id: 'weekly_feelings_follow_up',
    period: 'weekly',
    kind: 'multi_select',
    prompt: 'What did you feel?',
    helper: 'Select all that apply.',
    primaryFactor: 'mental',
    factors: ['mental', 'social', 'pain', 'environment', 'lifestyle'],
    options: [...NEGATIVE_FEELING_OPTIONS],
    sortOrder: 1.5,
    visibleWhen: (answers) => Number(answers.weekly_mental_health ?? 10) < 5,
    score: (answer) => scoreNegativeFeelings(answer as string[]),
  },
  {
    id: 'weekly_time_with_others',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How much time did you spend with family and friends?',
    primaryFactor: 'social',
    factors: ['social', 'mental'],
    options: [...WEEKLY_TIME_OPTIONS],
    sortOrder: 2.5,
    score: scoreWeeklyTimeWithOthers,
  },
  {
    id: 'weekly_pain_manageability',
    period: 'weekly',
    kind: 'slider',
    prompt: 'How manageable was your pain this week?',
    helper: '0 means not manageable. 10 means very manageable.',
    primaryFactor: 'pain',
    factors: ['pain'],
    min: 0,
    max: 10,
    ticks: [...WEEKLY_MENTAL_TICKS],
    sortOrder: 0,
    score: scoreWeeklyPain,
  },
  {
    id: 'weekly_routine',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How regular was your daily routine this week?',
    primaryFactor: 'lifestyle',
    factors: ['lifestyle', 'mental'],
    options: [...WEEKLY_ROUTINE_OPTIONS],
    sortOrder: 4,
    score: scoreWeeklyRoutine,
  },
  {
    id: 'weekly_food_support',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How often did your food choices support your health goals this week?',
    primaryFactor: 'diet',
    factors: ['diet', 'lifestyle'],
    options: [...WEEKLY_FOOD_OPTIONS],
    sortOrder: 5,
    score: scoreWeeklyFood,
  },
  {
    id: 'weekly_environment_support',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How often did your environment help you feel settled this week?',
    primaryFactor: 'environment',
    factors: ['environment', 'mental'],
    options: [...WEEKLY_ENVIRONMENT_OPTIONS],
    sortOrder: 6,
    score: scoreWeeklyEnvironment,
  },
  {
    id: 'weekly_medication_consistency',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How consistent were you with medications or care routines this week?',
    primaryFactor: 'medication',
    factors: ['medication'],
    options: [...WEEKLY_MEDICATION_OPTIONS],
    sortOrder: 7,
    score: scoreWeeklyMedication,
  },
  {
    id: 'weekly_movement_frequency',
    period: 'weekly',
    kind: 'single_choice',
    prompt: 'How often did you intentionally move your body this week?',
    primaryFactor: 'activity',
    factors: ['activity', 'lifestyle'],
    options: [...WEEKLY_MOVEMENT_OPTIONS],
    sortOrder: 8,
    score: scoreWeeklyMovement,
  },
] satisfies QuestionDefinition[]

export function getTodayKey(date = new Date()) {
  return formatDateKey(date)
}

export function getWeekKey(date = new Date()) {
  return formatDateKey(startOfWeek(date))
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
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
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
  return getGreetingForHour(date.getHours())
}

export function getSessionId(date: string, period: CheckInPeriod) {
  return `${date}:${period}`
}

export function getQuestionsForPeriod(
  period: CheckInPeriod,
  answers: Record<string, AnswerValue> = {},
  options: {
    includeMorningQuestions?: boolean
  } = {}
) {
  const periods =
    period === 'night' && options.includeMorningQuestions
      ? ['morning', 'night']
      : [period]
  const periodOrder: Record<CheckInPeriod, number> = {
    morning: 0,
    night: 1,
    weekly: 2,
  }

  return QUESTION_BANK.filter((question) => periods.includes(question.period))
    .filter((question) => (question.visibleWhen ? question.visibleWhen(answers) : true))
    .sort((a, b) => {
      if (a.period !== b.period) {
        return periodOrder[a.period] - periodOrder[b.period]
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder
      }

      return FACTOR_ORDER.indexOf(a.primaryFactor) - FACTOR_ORDER.indexOf(b.primaryFactor)
    })
}

export function createEmptyAnswers(period: CheckInPeriod) {
  return createCheckInAnswers(period)
}

export function createCheckInAnswers(
  period: CheckInPeriod,
  options: {
    includeMorningQuestions?: boolean
  } = {}
) {
  const answers: Record<string, AnswerValue> = {}

  for (const question of getQuestionsForPeriod(period, {}, options)) {
    if (question.kind === 'slider') {
      answers[question.id] = Math.round((question.min + question.max) / 2)
    }

    if (question.kind === 'single_choice') {
      answers[question.id] = question.options[0]
    }

    if (question.kind === 'multi_select') {
      answers[question.id] = []
    }

    if (question.kind === 'substance_use') {
      answers[question.id] = {
        substances: [],
        customSubstance: '',
        frequency: 'None',
      } satisfies SubstanceUseAnswer
    }
  }

  return answers
}

export function getAnswersForPeriod(
  answers: Record<string, AnswerValue>,
  period: CheckInPeriod
) {
  const questionIds = QUESTION_BANK.filter((question) => question.period === period).map((question) => question.id)

  return Object.fromEntries(
    Object.entries(answers).filter(([questionId]) => questionIds.includes(questionId))
  )
}

function seedFamilyMembers(date = new Date()) {
  const today = getTodayKey(date)
  const morningTimestamp = new Date(`${today}T08:42:00`).toISOString()
  const eveningTimestamp = new Date(`${today}T19:18:00`).toISOString()

  return [
    {
      id: 'fam-lina',
      name: 'Lina',
      relation: 'Sister',
      streak: 11,
      checkedInToday: true,
      lastCheckInAt: eveningTimestamp,
    },
    {
      id: 'fam-noah',
      name: 'Noah',
      relation: 'Partner',
      streak: 7,
      checkedInToday: true,
      lastCheckInAt: morningTimestamp,
    },
    {
      id: 'fam-ava',
      name: 'Ava',
      relation: 'Mother',
      streak: 18,
      checkedInToday: false,
      lastCheckInAt: new Date(`${getYesterdayKey(date)}T20:10:00`).toISOString(),
    },
  ] satisfies FamilyMember[]
}

function seedConnectedApps(date = new Date(), days = 120) {
  const snapshots: ConnectedAppSnapshot[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(date)
    current.setDate(current.getDate() - offset)
    const dateKey = getTodayKey(current)
    const dayOfMonth = current.getDate()

    snapshots.push({
      date: dateKey,
      myFitnessPal: {
        sodiumMg: 1850 + ((dayOfMonth * 97) % 1100),
        targetSodiumMg: 2300,
        produceServings: 2 + (dayOfMonth % 5),
      },
      wearable: {
        steps: 3200 + ((dayOfMonth * 1103) % 6800),
        activeMinutes: 18 + ((dayOfMonth * 7) % 48),
        sleepHours: 5.7 + ((dayOfMonth % 7) * 0.34),
      },
      medicationTracker: {
        adherencePercent: 64 + ((dayOfMonth * 9) % 34),
      },
      environmentJournal: {
        calmnessScore: 48 + ((dayOfMonth * 11) % 42),
      },
    })
  }

  return snapshots
}

export function createDefaultState(date = new Date()): WellnessState {
  return {
    sessions: {},
    reminders: DEFAULT_REMINDERS,
    privacy: DEFAULT_PRIVACY,
    familyMembers: seedFamilyMembers(date),
    connectedApps: seedConnectedApps(date),
  }
}

export function readWellnessState() {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createDefaultState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WellnessState>
    const defaultState = createDefaultState()

    return {
      sessions: parsed.sessions ?? defaultState.sessions,
      reminders: { ...defaultState.reminders, ...parsed.reminders },
      privacy: { ...defaultState.privacy, ...parsed.privacy },
      familyMembers:
        parsed.familyMembers && parsed.familyMembers.length
          ? parsed.familyMembers
          : defaultState.familyMembers,
      connectedApps:
        parsed.connectedApps && parsed.connectedApps.length
          ? parsed.connectedApps
          : defaultState.connectedApps,
    } satisfies WellnessState
  } catch {
    return createDefaultState()
  }
}

export function writeWellnessState(state: WellnessState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getSessionsList(sessions: Record<string, CheckInSession>) {
  return Object.values(sessions).sort((a, b) => a.completedAt.localeCompare(b.completedAt))
}

export function getSessionForDate(
  sessions: Record<string, CheckInSession>,
  date: string,
  period: CheckInPeriod
) {
  return sessions[getSessionId(date, period)]
}

export function saveSession(
  sessions: Record<string, CheckInSession>,
  date: string,
  period: CheckInPeriod,
  answers: Record<string, AnswerValue>
) {
  const session: CheckInSession = {
    id: getSessionId(date, period),
    date,
    weekKey: getWeekKey(parseDateKey(date)),
    period,
    answers,
    completedAt: new Date().toISOString(),
  }

  return {
    ...sessions,
    [session.id]: session,
  }
}

export function copyPreviousAnswers(
  sessions: Record<string, CheckInSession>,
  date: string,
  period: CheckInPeriod
) {
  const previousDate = getYesterdayKey(parseDateKey(date))
  const previousSession = getSessionForDate(sessions, previousDate, period)

  if (!previousSession) {
    return null
  }

  return { ...previousSession.answers }
}

export function getTodayStatus(
  sessions: Record<string, CheckInSession>,
  date = getTodayKey()
) {
  const morningComplete = Boolean(getSessionForDate(sessions, date, 'morning'))
  const nightComplete = Boolean(getSessionForDate(sessions, date, 'night'))
  const weeklyComplete = Boolean(getSessionForDate(sessions, date, 'weekly')) ||
    getSessionsList(sessions).some((session) => session.period === 'weekly' && session.weekKey === getWeekKey(parseDateKey(date)))

  return {
    morningComplete,
    nightComplete,
    weeklyComplete,
    completedSlots: Number(morningComplete) + Number(nightComplete),
  }
}

export function getDailyStatusLabel(
  sessions: Record<string, CheckInSession>,
  date: string,
  period: 'morning' | 'night'
) {
  const session = getSessionForDate(sessions, date, period)

  if (session) {
    return 'Completed'
  }

  const now = new Date()
  const today = getTodayKey(now)

  if (date < today) {
    return 'Missed'
  }

  if (period === 'morning' && now.getHours() >= 15) {
    return 'Missed'
  }

  if (period === 'night' && now.getHours() < 17) {
    return 'Later tonight'
  }

  return 'Open'
}

export function isWeeklyCheckInDue(
  sessions: Record<string, CheckInSession>,
  date = new Date()
) {
  const weekKey = getWeekKey(date)

  return !getSessionsList(sessions).some(
    (session) => session.period === 'weekly' && session.weekKey === weekKey
  )
}

export function getConsecutiveStreak(
  sessions: Record<string, CheckInSession>,
  referenceKey = getTodayKey()
) {
  if (!Object.keys(sessions).length) {
    return 0
  }

  let streak = 0
  let cursor = parseDateKey(referenceKey)
  const hasTodayActivity =
    Boolean(getSessionForDate(sessions, referenceKey, 'morning')) ||
    Boolean(getSessionForDate(sessions, referenceKey, 'night'))

  if (!hasTodayActivity) {
    cursor = parseDateKey(getYesterdayKey(cursor))
  }

  while (true) {
    const key = formatDateKey(cursor)
    const hasAnyDailySession =
      Boolean(getSessionForDate(sessions, key, 'morning')) ||
      Boolean(getSessionForDate(sessions, key, 'night'))

    if (!hasAnyDailySession) {
      break
    }

    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getMonthProgress(
  sessions: Record<string, CheckInSession>,
  referenceKey = getTodayKey()
) {
  const referenceDate = parseDateKey(referenceKey)
  const monthPrefix = referenceKey.slice(0, 7)
  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  ).getDate()
  const completedSlots = getSessionsList(sessions).filter(
    (session) => session.period !== 'weekly' && session.date.startsWith(monthPrefix)
  ).length
  const targetSlots = daysInMonth * 2
  const progress = completedSlots / targetSlots
  const stage = Math.min(5, Math.floor(progress * 6))

  return {
    completedSlots,
    targetSlots,
    progress,
    stage,
    monthLabel: getMonthLabel(referenceKey),
  }
}

export function getPeriodLabel(period: CheckInPeriod) {
  if (period === 'morning') return 'Day'
  if (period === 'night') return 'Night'
  return 'Weekly'
}

function evaluateSession(session: CheckInSession) {
  const observations: FactorObservation[] = []

  for (const question of QUESTION_BANK) {
    if (question.period !== session.period) {
      continue
    }

    const answer = session.answers[question.id]

    if (typeof answer === 'undefined') {
      continue
    }

    observations.push(...question.score(answer, session.answers))
  }

  return observations
}

export function calculateFactorScoresForDate(
  date: string,
  sessions: Record<string, CheckInSession>,
  connectedApps: ConnectedAppSnapshot[]
) {
  const daySessions = getSessionsList(sessions).filter(
    (session) =>
      (session.date === date && (session.period === 'morning' || session.period === 'night')) ||
      (session.period === 'weekly' && session.weekKey === getWeekKey(parseDateKey(date)))
  )

  const appSnapshot = connectedApps.find((snapshot) => snapshot.date === date)
  const observations = daySessions.flatMap(evaluateSession)

  if (appSnapshot) {
    observations.push(...scoreConnectedApps(appSnapshot))
  }

  const factorScores = Object.fromEntries(
    FACTOR_CONFIG.map((factor) => {
      const relevantObservations = observations.filter((observation) => observation.factor === factor.key)

      if (!relevantObservations.length) {
        return [factor.key, 50]
      }

      const weightedTotal = relevantObservations.reduce(
        (total, observation) => total + observation.score * observation.weight,
        0
      )
      const totalWeight = relevantObservations.reduce((total, observation) => total + observation.weight, 0)

      return [factor.key, clampScore(weightedTotal / totalWeight)]
    })
  ) as Record<FactorKey, number>

  return {
    factorScores,
    totalScore: clampScore(average(Object.values(factorScores))),
    observations,
  } satisfies FactorScoreSummary
}

export function getLatestAvailableDate(
  sessions: Record<string, CheckInSession>,
  connectedApps: ConnectedAppSnapshot[]
) {
  const sessionDates = getSessionsList(sessions).map((session) => session.date)
  const connectedDates = connectedApps.map((snapshot) => snapshot.date)
  const allDates = [...sessionDates, ...connectedDates].sort()

  return allDates.at(-1) ?? getTodayKey()
}

function buildDateRange(
  start: Date,
  end: Date,
  unit: 'day' | 'week' | 'month'
) {
  const values: Date[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    values.push(new Date(cursor))

    if (unit === 'day') {
      cursor.setDate(cursor.getDate() + 1)
    }

    if (unit === 'week') {
      cursor.setDate(cursor.getDate() + 7)
    }

    if (unit === 'month') {
      cursor.setMonth(cursor.getMonth() + 1, 1)
    }
  }

  return values
}

export function getTrendPoints(
  sessions: Record<string, CheckInSession>,
  connectedApps: ConnectedAppSnapshot[],
  range: 'weekly' | 'monthly' | 'yearly',
  referenceDate = new Date()
) {
  const rangeStart = new Date(referenceDate)
  let unit: 'day' | 'week' | 'month' = 'day'

  if (range === 'weekly') {
    rangeStart.setDate(rangeStart.getDate() - 6)
    unit = 'day'
  }

  if (range === 'monthly') {
    rangeStart.setDate(rangeStart.getDate() - 28)
    unit = 'week'
  }

  if (range === 'yearly') {
    rangeStart.setMonth(rangeStart.getMonth() - 11, 1)
    unit = 'month'
  }

  const dates = buildDateRange(rangeStart, referenceDate, unit)

  return dates.map((date) => {
    if (unit === 'day') {
      const dateKey = getTodayKey(date)
      const summary = calculateFactorScoresForDate(dateKey, sessions, connectedApps)
      return {
        label: formatShortDate(dateKey),
        periodKey: dateKey,
        factorScores: summary.factorScores,
        totalScore: summary.totalScore,
      } satisfies TrendPoint
    }

    const bucketStart = unit === 'week' ? startOfWeek(date) : new Date(date.getFullYear(), date.getMonth(), 1)
    const bucketEnd = unit === 'week' ? endOfWeek(date) : new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)
    const bucketDates: string[] = []
    const cursor = new Date(bucketStart)

    while (cursor <= bucketEnd && cursor <= referenceDate) {
      bucketDates.push(getTodayKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    const dailySummaries = bucketDates.map((dateKey) =>
      calculateFactorScoresForDate(dateKey, sessions, connectedApps)
    )

    const factorScores = Object.fromEntries(
      FACTOR_CONFIG.map((factor) => [
        factor.key,
        clampScore(average(dailySummaries.map((summary) => summary.factorScores[factor.key]))),
      ])
    ) as Record<FactorKey, number>

    return {
      label:
        unit === 'week'
          ? `${formatShortDate(bucketDates[0] ?? getTodayKey(date))}`
          : date.toLocaleDateString('en-US', { month: 'short' }),
      periodKey: getTodayKey(bucketStart),
      factorScores,
      totalScore: clampScore(average(Object.values(factorScores))),
    } satisfies TrendPoint
  })
}

export function getFamilyNudgeCandidate(
  familyMembers: FamilyMember[],
  sessions: Record<string, CheckInSession>,
  todayKey = getTodayKey()
) {
  const currentUserHasCheckedIn =
    Boolean(getSessionForDate(sessions, todayKey, 'morning')) ||
    Boolean(getSessionForDate(sessions, todayKey, 'night'))

  if (currentUserHasCheckedIn) {
    return null
  }

  return familyMembers
    .filter((member) => member.checkedInToday)
    .sort((a, b) => b.lastCheckInAt.localeCompare(a.lastCheckInAt))[0] ?? null
}
