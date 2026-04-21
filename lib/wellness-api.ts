import {
  AnswerValue,
  CheckInPeriod,
  ConnectedAppSnapshot,
  FamilyMember,
  ReminderSettings,
  PrivacySettings,
  WellnessState,
  getSessionId,
  getWeekKey,
} from '@/components/checkInData'

type ApiCheckInSession = {
  id: string
  user_id: string
  entry_date: string
  week_key: string
  period: CheckInPeriod
  answers: Record<string, unknown>
  completed_at: string
}

type ApiReminderSettings = {
  night_reminder_enabled: boolean
  night_reminder_hour: number
  family_nudges_enabled: boolean
  night_reminder_last_sent_date: string | null
  family_nudge_last_sent_at: string | null
}

type ApiPrivacySettings = {
  share_graphs_with_family: boolean
}

type ApiFamilyMember = {
  id: string
  owner_user_id: string
  invited_user_id: string | null
  invite_email: string | null
  name: string
  relation: string
  status: 'pending' | 'active' | 'archived'
  can_view_graphs: boolean
  streak: number
  checked_in_today: boolean
  last_check_in_at: string | null
}

type ApiConnectedAppSnapshot = {
  id: string
  user_id: string
  snapshot_date: string
  source: 'myfitnesspal' | 'wearable' | 'medication_tracker' | 'environment_journal'
  payload: Record<string, unknown>
}

type ApiWellnessState = {
  profile: {
    user_id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
  }
  sessions: ApiCheckInSession[]
  reminders: ApiReminderSettings
  privacy: ApiPrivacySettings
  family_members: ApiFamilyMember[]
  connected_apps: ApiConnectedAppSnapshot[]
}

type ApiDailySummary = {
  date: string
  factor_scores: Record<string, number>
  total_score: number
  observations: Array<{
    factor: string
    score: number
    weight: number
    source: string
  }>
}

type ApiTrendPoint = {
  label: string
  period_key: string
  factor_scores: Record<string, number>
  total_score: number
}

type ApiTrendsResponse = {
  range: 'weekly' | 'monthly' | 'yearly'
  points: ApiTrendPoint[]
}

function emptyConnectedAppSnapshot(date: string): ConnectedAppSnapshot {
  return {
    date,
    myFitnessPal: {
      sodiumMg: 0,
      targetSodiumMg: 2300,
      produceServings: 0,
    },
    wearable: {
      steps: 0,
      activeMinutes: 0,
      sleepHours: 0,
    },
    medicationTracker: {
      adherencePercent: 0,
    },
    environmentJournal: {
      calmnessScore: 0,
    },
  }
}

export function mapWellnessStateFromApi(payload: ApiWellnessState): WellnessState {
  const sessions = Object.fromEntries(
    payload.sessions.map((session) => [
      getSessionId(session.entry_date, session.period),
      {
        id: session.id,
        date: session.entry_date,
        weekKey: session.week_key,
        period: session.period,
        answers: session.answers as Record<string, AnswerValue>,
        completedAt: session.completed_at,
      },
    ])
  )

  const reminders: ReminderSettings = {
    nightReminderEnabled: payload.reminders.night_reminder_enabled,
    nightReminderHour: payload.reminders.night_reminder_hour,
    familyNudgesEnabled: payload.reminders.family_nudges_enabled,
    nightReminderLastSentDate: payload.reminders.night_reminder_last_sent_date,
    familyNudgeLastSentAt: payload.reminders.family_nudge_last_sent_at,
  }

  const familyMembers: FamilyMember[] = payload.family_members.map((member) => ({
    id: member.id,
    name: member.name,
    relation: member.relation,
    streak: member.streak,
    checkedInToday: member.checked_in_today,
    lastCheckInAt: member.last_check_in_at ?? '',
  }))

  const connectedAppsByDate = new Map<string, ConnectedAppSnapshot>()
  for (const snapshot of payload.connected_apps) {
    const current = connectedAppsByDate.get(snapshot.snapshot_date) ?? emptyConnectedAppSnapshot(snapshot.snapshot_date)

    if (snapshot.source === 'myfitnesspal') {
      current.myFitnessPal = {
        sodiumMg: Number(snapshot.payload.sodiumMg ?? 0),
        targetSodiumMg: Number(snapshot.payload.targetSodiumMg ?? 2300),
        produceServings: Number(snapshot.payload.produceServings ?? 0),
      }
    }

    if (snapshot.source === 'wearable') {
      current.wearable = {
        steps: Number(snapshot.payload.steps ?? 0),
        activeMinutes: Number(snapshot.payload.activeMinutes ?? 0),
        sleepHours: Number(snapshot.payload.sleepHours ?? 0),
      }
    }

    if (snapshot.source === 'medication_tracker') {
      current.medicationTracker = {
        adherencePercent: Number(snapshot.payload.adherencePercent ?? 0),
      }
    }

    if (snapshot.source === 'environment_journal') {
      current.environmentJournal = {
        calmnessScore: Number(snapshot.payload.calmnessScore ?? 0),
      }
    }

    connectedAppsByDate.set(snapshot.snapshot_date, current)
  }

  const privacy: PrivacySettings = {
    shareGraphsWithFamily: payload.privacy.share_graphs_with_family,
    sharedFamilyMemberIds: payload.family_members
      .filter((member) => member.can_view_graphs)
      .map((member) => member.id),
  }

  return {
    sessions,
    reminders,
    privacy,
    familyMembers,
    connectedApps: Array.from(connectedAppsByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const rawBody = await response.text()
  let parsedBody: unknown = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody)
    } catch {
      parsedBody = rawBody
    }
  }

  if (!response.ok) {
    if (parsedBody && typeof parsedBody === 'object') {
      const payload = parsedBody as { detail?: unknown; error?: unknown }
      const detail =
        typeof payload.detail === 'string'
          ? payload.detail
          : typeof payload.error === 'string'
            ? payload.error
            : null

      if (detail) {
        throw new Error(detail)
      }
    }

    if (typeof parsedBody === 'string' && !parsedBody.trim().startsWith('<')) {
      throw new Error(parsedBody)
    }

    throw new Error(`Request failed with status ${response.status}.`)
  }

  return parsedBody as T
}

export async function fetchWellnessState() {
  const payload = await apiRequest<ApiWellnessState>('wellness/state')
  return mapWellnessStateFromApi(payload)
}

export async function saveCheckIn(params: {
  entryDate: string
  period: CheckInPeriod
  answers: Record<string, unknown>
  completedAt?: string
}) {
  const payload: {
    entry_date: string
    period: CheckInPeriod
    answers: Record<string, unknown>
    completed_at?: string
  } = {
    entry_date: params.entryDate,
    period: params.period,
    answers: params.answers,
  }

  if (params.completedAt) {
    payload.completed_at = params.completedAt
  }

  await apiRequest('check-ins', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateReminderSettings(reminders: ReminderSettings) {
  await apiRequest<ApiReminderSettings>('settings/reminders', {
    method: 'PUT',
    body: JSON.stringify({
      night_reminder_enabled: reminders.nightReminderEnabled,
      night_reminder_hour: reminders.nightReminderHour,
      family_nudges_enabled: reminders.familyNudgesEnabled,
      night_reminder_last_sent_date: reminders.nightReminderLastSentDate,
      family_nudge_last_sent_at: reminders.familyNudgeLastSentAt,
    }),
  })
}

export async function updatePrivacySettings(privacy: PrivacySettings) {
  await apiRequest<ApiPrivacySettings>('settings/privacy', {
    method: 'PUT',
    body: JSON.stringify({
      share_graphs_with_family: privacy.shareGraphsWithFamily,
    }),
  })
}

export async function createFamilyMember(input: { name: string; relation: string }) {
  await apiRequest<ApiFamilyMember>('family-members', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      relation: input.relation,
    }),
  })
}

export async function updateFamilyMemberSharing(memberId: string, canViewGraphs: boolean) {
  await apiRequest<ApiFamilyMember>(`family-members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      can_view_graphs: canViewGraphs,
    }),
  })
}

export async function fetchDailySummary(targetDate?: string) {
  const query = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : ''
  return apiRequest<ApiDailySummary>(`insights/summary${query}`)
}

export async function fetchTrendPoints(range: 'weekly' | 'monthly' | 'yearly') {
  return apiRequest<ApiTrendsResponse>(`insights/trends?range=${encodeURIComponent(range)}`)
}

export function createEmptyWellnessState(): WellnessState {
  return {
    sessions: {},
    reminders: {
      nightReminderEnabled: true,
      nightReminderHour: 20,
      familyNudgesEnabled: true,
      nightReminderLastSentDate: null,
      familyNudgeLastSentAt: null,
    },
    privacy: {
      shareGraphsWithFamily: false,
      sharedFamilyMemberIds: [],
    },
    familyMembers: [],
    connectedApps: [],
  }
}

export function currentWeekKeyFromDate(date: string) {
  return getWeekKey(new Date(`${date}T12:00:00`))
}
