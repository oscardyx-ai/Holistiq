export type DomainKey =
  | 'pain'
  | 'mental_health'
  | 'social'
  | 'lifestyle'
  | 'diet'
  | 'environment'
  | 'medication'
  | 'activity'
  | 'sleep'
  | 'safety'

export type CheckInTier = 'beginner' | 'intermediate' | 'advanced'

export type QuestionTiming = 'morning' | 'night' | 'weekly' | 'triggered'

export type ResponseType = 'single_choice' | 'multi_choice' | 'scale' | 'text_optional'

export type FlagLevel = 0 | 1 | 2 | 3 | 4

export type SafetyAction = 'none' | 'show_resources' | 'urgent_care' | 'emergency'

export interface AnswerOption {
  id: string
  label: string
  score: number | null
  flagLevel?: FlagLevel
  triggers?: string[]
}

export interface Question {
  id: string
  domain: DomainKey
  tier: CheckInTier | 'all'
  timing: QuestionTiming
  text: string
  examples?: string[]
  responseType: ResponseType
  options: AnswerOption[]
  required: boolean
  followUpOnly?: boolean
  maxSelect?: number
}

export interface TriggerCondition {
  questionId: string
  operator: 'equals' | 'in' | 'gte' | 'lte' | 'contains'
  value: string | number | (string | number)[]
}

export interface TriggerRule {
  id: string
  name: string
  domain: DomainKey
  condition: TriggerCondition
  followUpQuestionIds: string[]
  flagLevel: FlagLevel
  patientMessage?: string
  clinicianFlagLabel?: string
  safetyAction: SafetyAction
  notifyClinician: boolean
  includeInSummary: boolean
}

export interface TrendRule {
  id: string
  name: string
  domain: DomainKey
  flagLevel: FlagLevel
  clinicianFlagLabel?: string
  safetyAction: SafetyAction
  patientMessage?: string
  notifyClinician: boolean
  windowDays: number
  minOccurrences: number
}

export interface PatientFlag {
  id: string
  ruleId: string
  domain: DomainKey
  flagLevel: FlagLevel
  status: 'active' | 'resolved' | 'dismissed'
  createdAt: Date
  resolvedAt?: Date
  visibleToPatient: boolean
  visibleToClinician: boolean
  clinicianLabel?: string
  patientMessage?: string
  safetyAction: SafetyAction
}
