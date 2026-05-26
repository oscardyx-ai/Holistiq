import {
  type AnswerValue,
  type CheckInPeriod,
  type ConnectedAppSnapshot,
  type FamilyMember,
  type PrivacySettings,
  type ReminderSettings,
  type WellnessState,
  getSessionId,
} from '@/components/checkInData'

export type ApiCheckInSession = {
  id: string
  user_id: string
  entry_date: string
  week_key: string
  period: CheckInPeriod
  answers: Record<string, unknown>
  completed_at: string
}

export type ApiReminderSettings = {
  night_reminder_enabled: boolean
  night_reminder_hour: number
  family_nudges_enabled: boolean
  night_reminder_last_sent_date: string | null
  family_nudge_last_sent_at: string | null
}

export type ApiPrivacySettings = {
  share_graphs_with_family: boolean
}

export type ApiFamilyMember = {
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

export type ApiConnectedAppSnapshot = {
  id: string
  user_id: string
  snapshot_date: string
  source: 'myfitnesspal' | 'wearable' | 'medication_tracker' | 'environment_journal'
  payload: Record<string, unknown>
}

export type ApiWellnessState = {
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

export type ApiDailySummary = {
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

export type ApiTrendPoint = {
  label: string
  period_key: string
  factor_scores: Record<string, number>
  total_score: number
}

export type ApiTrendsResponse = {
  range: 'weekly' | 'monthly' | 'yearly'
  points: ApiTrendPoint[]
}

export function emptyConnectedAppSnapshot(date: string): ConnectedAppSnapshot {
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

export function aggregateConnectedAppSnapshots(
  snapshots: ApiConnectedAppSnapshot[],
): ConnectedAppSnapshot[] {
  const connectedAppsByDate = new Map<string, ConnectedAppSnapshot>()

  for (const snapshot of snapshots) {
    const current =
      connectedAppsByDate.get(snapshot.snapshot_date) ??
      emptyConnectedAppSnapshot(snapshot.snapshot_date)

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

  return Array.from(connectedAppsByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
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
    ]),
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
    connectedApps: aggregateConnectedAppSnapshots(payload.connected_apps),
  }
}
