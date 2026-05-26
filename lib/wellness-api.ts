import {
  CheckInPeriod,
  ReminderSettings,
  PrivacySettings,
  WellnessState,
  getWeekKey,
} from '@/components/checkInData'
import {
  type ApiFamilyMember,
  mapWellnessStateFromApi,
  type ApiDailySummary,
  type ApiPrivacySettings,
  type ApiReminderSettings,
  type ApiTrendsResponse,
  type ApiWellnessState,
} from '@/lib/wellness-contract'

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

export async function createFamilyMember(input: { name: string; relation: string; inviteEmail?: string }) {
  await apiRequest<ApiFamilyMember>('family-members', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      relation: input.relation,
      invite_email: input.inviteEmail || null,
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
