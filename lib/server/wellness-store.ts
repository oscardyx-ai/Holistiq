import 'server-only'

import {
  type AnswerValue,
  calculateFactorScoresForDate,
  getConsecutiveStreak,
  getSessionId,
  getTodayKey,
  getTrendPoints,
  getWeekKey,
  type CheckInPeriod,
  type CheckInSession as FrontendCheckInSession,
} from '@/components/checkInData'
import { ApiError } from '@/lib/server/api-error'
import type { AuthenticatedUser } from '@/lib/server/auth-user'
import { getSupabaseAdminClient } from '@/lib/server/supabase-admin'
import {
  aggregateConnectedAppSnapshots,
  type ApiCheckInSession,
  type ApiConnectedAppSnapshot,
  type ApiDailySummary,
  type ApiFamilyMember,
  type ApiPrivacySettings,
  type ApiReminderSettings,
  type ApiTrendsResponse,
  type ApiWellnessState,
} from '@/lib/wellness-contract'

type UserProfileRow = {
  user_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

type ReminderSettingsRow = ApiReminderSettings & {
  user_id: string
}

type PrivacySettingsRow = ApiPrivacySettings & {
  user_id: string
}

type FamilyMemberStatus = 'pending' | 'active' | 'archived'

type FamilyMemberRow = {
  id: string
  owner_user_id: string
  invited_user_id: string | null
  invite_email: string | null
  name: string
  relation: string
  status: FamilyMemberStatus
  can_view_graphs: boolean
  created_at: string
}

const DEFAULT_REMINDER_SETTINGS: ApiReminderSettings = {
  night_reminder_enabled: true,
  night_reminder_hour: 20,
  family_nudges_enabled: true,
  night_reminder_last_sent_date: null,
  family_nudge_last_sent_at: null,
}

const DEFAULT_PRIVACY_SETTINGS: ApiPrivacySettings = {
  share_graphs_with_family: false,
}

const VALID_CHECK_IN_PERIODS = new Set<CheckInPeriod>([
  'morning',
  'night',
  'weekly',
])

const VALID_CONNECTED_APP_SOURCES = new Set<
  ApiConnectedAppSnapshot['source']
>(['myfitnesspal', 'wearable', 'medication_tracker', 'environment_journal'])

const VALID_FAMILY_MEMBER_STATUSES = new Set<FamilyMemberStatus>([
  'pending',
  'active',
  'archived',
])

function assertDateKey(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(`${fieldName} must be a YYYY-MM-DD string.`, 400)
  }

  return value
}

function assertTimestamp(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ApiError(`${fieldName} must be a valid ISO timestamp.`, 400)
  }

  return value
}

function assertObject(
  value: unknown,
  fieldName: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(`${fieldName} must be a JSON object.`, 400)
  }

  return value as Record<string, unknown>
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ApiError(`${fieldName} must be a string.`, 400)
  }

  return value
}

function asOptionalString(value: unknown): string | null | undefined {
  if (typeof value === 'undefined') {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new ApiError('Expected a string or null value.', 400)
  }
  return value
}

function asOptionalNumber(value: unknown, fieldName: string): number | undefined {
  if (typeof value === 'undefined') {
    return undefined
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError(`${fieldName} must be a number.`, 400)
  }
  return value
}

function assertSupabaseResult<T>(
  data: T | null,
  error: { message: string } | null,
  message: string,
): T {
  if (error) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      throw new ApiError(
        `${message} Supabase tables are missing. Apply the schema in supabase/migrations before using the app.`,
        500,
      )
    }

    throw new ApiError(`${message} ${error.message}`, 500)
  }

  if (data === null) {
    throw new ApiError(message, 500)
  }

  return data
}

function toFrontendSession(session: ApiCheckInSession): FrontendCheckInSession {
  return {
    id: session.id,
    date: session.entry_date,
    weekKey: session.week_key,
    period: session.period,
    answers: session.answers as Record<string, AnswerValue>,
    completedAt: session.completed_at,
  }
}

function buildSessionRecord(
  sessions: ApiCheckInSession[],
): Record<string, FrontendCheckInSession> {
  return Object.fromEntries(
    sessions.map((session) => [
      getSessionId(session.entry_date, session.period),
      toFrontendSession(session),
    ]),
  )
}

async function ensureUserState(user: AuthenticatedUser) {
  const supabase = getSupabaseAdminClient()

  const profilePayload: UserProfileRow = {
    user_id: user.userId,
    email: user.email,
    full_name: user.fullName,
    avatar_url: user.avatarUrl,
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .upsert(profilePayload, { onConflict: 'user_id' })
    .select('user_id, email, full_name, avatar_url')
    .single()

  const syncedProfile = assertSupabaseResult(
    profile,
    profileError,
    'Unable to sync the user profile.',
  )

  const reminderInsert = await supabase.from('reminder_settings').upsert(
    {
      user_id: user.userId,
      ...DEFAULT_REMINDER_SETTINGS,
    },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )
  if (reminderInsert.error) {
    assertSupabaseResult(null, reminderInsert.error, 'Unable to ensure reminder settings.')
  }

  const privacyInsert = await supabase.from('privacy_settings').upsert(
    {
      user_id: user.userId,
      ...DEFAULT_PRIVACY_SETTINGS,
    },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )
  if (privacyInsert.error) {
    assertSupabaseResult(null, privacyInsert.error, 'Unable to ensure privacy settings.')
  }

  const { data: reminders, error: remindersError } = await supabase
    .from('reminder_settings')
    .select(
      'user_id, night_reminder_enabled, night_reminder_hour, family_nudges_enabled, night_reminder_last_sent_date, family_nudge_last_sent_at',
    )
    .eq('user_id', user.userId)
    .single()

  const { data: privacy, error: privacyError } = await supabase
    .from('privacy_settings')
    .select('user_id, share_graphs_with_family')
    .eq('user_id', user.userId)
    .single()

  return {
    profile: syncedProfile,
    reminders: assertSupabaseResult(
      reminders as ReminderSettingsRow | null,
      remindersError,
      'Unable to load reminder settings.',
    ),
    privacy: assertSupabaseResult(
      privacy as PrivacySettingsRow | null,
      privacyError,
      'Unable to load privacy settings.',
    ),
  }
}

async function listUserSessions(userId: string): Promise<ApiCheckInSession[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from('check_in_sessions')
    .select('id, user_id, entry_date, week_key, period, answers, completed_at')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true })
    .order('period', { ascending: true })

  return assertSupabaseResult(
    data as ApiCheckInSession[] | null,
    error,
    'Unable to load check-ins.',
  )
}

async function listUserSnapshots(userId: string): Promise<ApiConnectedAppSnapshot[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from('connected_app_snapshots')
    .select('id, user_id, snapshot_date, source, payload')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true })
    .order('source', { ascending: true })

  return assertSupabaseResult(
    data as ApiConnectedAppSnapshot[] | null,
    error,
    'Unable to load connected app data.',
  )
}

async function listFamilyMemberRows(userId: string): Promise<FamilyMemberRow[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from('family_members')
    .select(
      'id, owner_user_id, invited_user_id, invite_email, name, relation, status, can_view_graphs, created_at',
    )
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: true })

  return assertSupabaseResult(
    data as FamilyMemberRow[] | null,
    error,
    'Unable to load family members.',
  )
}

async function enrichFamilyMembers(rows: FamilyMemberRow[]): Promise<ApiFamilyMember[]> {
  const invitedUserIds = rows
    .map((row) => row.invited_user_id)
    .filter((value): value is string => Boolean(value))

  const sessionsByUser = new Map<string, ApiCheckInSession[]>()
  if (invitedUserIds.length > 0) {
    const { data, error } = await getSupabaseAdminClient()
      .from('check_in_sessions')
      .select('id, user_id, entry_date, week_key, period, answers, completed_at')
      .in('user_id', invitedUserIds)
      .order('entry_date', { ascending: true })

    const invitedSessions = assertSupabaseResult(
      data as ApiCheckInSession[] | null,
      error,
      'Unable to load family streak data.',
    )

    for (const session of invitedSessions) {
      const current = sessionsByUser.get(session.user_id) ?? []
      current.push(session)
      sessionsByUser.set(session.user_id, current)
    }
  }

  const todayKey = getTodayKey()

  return rows.map((row) => {
    const invitedSessions = row.invited_user_id
      ? sessionsByUser.get(row.invited_user_id) ?? []
      : []
    const sessionRecord = buildSessionRecord(invitedSessions)
    const checkedInToday = invitedSessions.some(
      (session) =>
        session.entry_date === todayKey &&
        (session.period === 'morning' || session.period === 'night'),
    )
    const lastCheckInAt =
      invitedSessions.length > 0
        ? invitedSessions.reduce(
            (latest, session) =>
              session.completed_at > latest ? session.completed_at : latest,
            invitedSessions[0].completed_at,
          )
        : null

    return {
      id: row.id,
      owner_user_id: row.owner_user_id,
      invited_user_id: row.invited_user_id,
      invite_email: row.invite_email,
      name: row.name,
      relation: row.relation,
      status: row.status,
      can_view_graphs: row.can_view_graphs,
      streak: row.invited_user_id ? getConsecutiveStreak(sessionRecord, todayKey) : 0,
      checked_in_today: checkedInToday,
      last_check_in_at: lastCheckInAt,
    }
  })
}

export async function getMe(user: AuthenticatedUser) {
  const { profile } = await ensureUserState(user)
  return profile
}

export async function getWellnessState(user: AuthenticatedUser): Promise<ApiWellnessState> {
  const [{ profile, reminders, privacy }, sessions, members, snapshots] = await Promise.all([
    ensureUserState(user),
    listUserSessions(user.userId),
    listFamilyMemberRows(user.userId),
    listUserSnapshots(user.userId),
  ])

  return {
    profile,
    sessions,
    reminders,
    privacy,
    family_members: await enrichFamilyMembers(members),
    connected_apps: snapshots,
  }
}

export async function listCheckIns(
  user: AuthenticatedUser,
  filters: {
    startDate?: string | null
    endDate?: string | null
    period?: string | null
  },
) {
  await ensureUserState(user)

  let query = getSupabaseAdminClient()
    .from('check_in_sessions')
    .select('id, user_id, entry_date, week_key, period, answers, completed_at')
    .eq('user_id', user.userId)
    .order('entry_date', { ascending: true })
    .order('period', { ascending: true })

  if (filters.startDate) {
    query = query.gte('entry_date', assertDateKey(filters.startDate, 'start_date'))
  }

  if (filters.endDate) {
    query = query.lte('entry_date', assertDateKey(filters.endDate, 'end_date'))
  }

  if (filters.period) {
    if (!VALID_CHECK_IN_PERIODS.has(filters.period as CheckInPeriod)) {
      throw new ApiError('period must be morning, night, or weekly.', 400)
    }
    query = query.eq('period', filters.period)
  }

  const { data, error } = await query

  return {
    sessions: assertSupabaseResult(
      data as ApiCheckInSession[] | null,
      error,
      'Unable to load check-ins.',
    ),
  }
}

export async function upsertCheckIn(
  user: AuthenticatedUser,
  payload: unknown,
): Promise<ApiCheckInSession> {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  const entryDate = assertDateKey(body.entry_date, 'entry_date')
  const period = assertString(body.period, 'period')
  const answers = assertObject(body.answers, 'answers')

  if (!VALID_CHECK_IN_PERIODS.has(period as CheckInPeriod)) {
    throw new ApiError('period must be morning, night, or weekly.', 400)
  }

  const completedAt =
    typeof body.completed_at === 'undefined'
      ? new Date().toISOString()
      : assertTimestamp(body.completed_at, 'completed_at')

  const row = {
    user_id: user.userId,
    entry_date: entryDate,
    week_key: getWeekKey(new Date(`${entryDate}T12:00:00`)),
    period,
    answers,
    completed_at: completedAt,
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('check_in_sessions')
    .upsert(row, {
      onConflict: 'user_id,entry_date,period',
    })
    .select('id, user_id, entry_date, week_key, period, answers, completed_at')
    .single()

  return assertSupabaseResult(
    data as ApiCheckInSession | null,
    error,
    'Unable to save the check-in.',
  )
}

export async function getReminderSettings(user: AuthenticatedUser) {
  const { reminders } = await ensureUserState(user)
  return reminders
}

export async function updateReminderSettings(
  user: AuthenticatedUser,
  payload: unknown,
) {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  const update: Partial<ApiReminderSettings> = {}

  if (typeof body.night_reminder_enabled !== 'undefined') {
    if (typeof body.night_reminder_enabled !== 'boolean') {
      throw new ApiError('night_reminder_enabled must be a boolean.', 400)
    }
    update.night_reminder_enabled = body.night_reminder_enabled
  }

  if (typeof body.night_reminder_hour !== 'undefined') {
    const hour = asOptionalNumber(body.night_reminder_hour, 'night_reminder_hour')
    if (typeof hour !== 'number' || hour < 0 || hour > 23) {
      throw new ApiError('night_reminder_hour must be between 0 and 23.', 400)
    }
    update.night_reminder_hour = hour
  }

  if (typeof body.family_nudges_enabled !== 'undefined') {
    if (typeof body.family_nudges_enabled !== 'boolean') {
      throw new ApiError('family_nudges_enabled must be a boolean.', 400)
    }
    update.family_nudges_enabled = body.family_nudges_enabled
  }

  if (typeof body.night_reminder_last_sent_date !== 'undefined') {
    update.night_reminder_last_sent_date =
      body.night_reminder_last_sent_date === null
        ? null
        : assertDateKey(
            body.night_reminder_last_sent_date,
            'night_reminder_last_sent_date',
          )
  }

  if (typeof body.family_nudge_last_sent_at !== 'undefined') {
    update.family_nudge_last_sent_at =
      body.family_nudge_last_sent_at === null
        ? null
        : assertTimestamp(
            body.family_nudge_last_sent_at,
            'family_nudge_last_sent_at',
          )
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('reminder_settings')
    .update(update)
    .eq('user_id', user.userId)
    .select(
      'night_reminder_enabled, night_reminder_hour, family_nudges_enabled, night_reminder_last_sent_date, family_nudge_last_sent_at',
    )
    .single()

  return assertSupabaseResult(
    data as ApiReminderSettings | null,
    error,
    'Unable to update reminder settings.',
  )
}

export async function getPrivacySettings(user: AuthenticatedUser) {
  const { privacy } = await ensureUserState(user)
  return privacy
}

export async function updatePrivacySettings(
  user: AuthenticatedUser,
  payload: unknown,
) {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  if (typeof body.share_graphs_with_family !== 'boolean') {
    throw new ApiError('share_graphs_with_family must be a boolean.', 400)
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('privacy_settings')
    .update({ share_graphs_with_family: body.share_graphs_with_family })
    .eq('user_id', user.userId)
    .select('share_graphs_with_family')
    .single()

  return assertSupabaseResult(
    data as ApiPrivacySettings | null,
    error,
    'Unable to update privacy settings.',
  )
}

async function sendInviteEmail(params: {
  inviteEmail: string
  inviterName: string
  memberName: string
  appUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return
  }

  const signupUrl = `${params.appUrl.replace(/\/$/, '')}/sign-up`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Holistiq <onboarding@resend.dev>',
      to: [params.inviteEmail],
      subject: "You've been invited to join Holistiq",
      html:
        `<p>Hi ${params.memberName},</p>` +
        `<p>${params.inviterName} has invited you to join them on Holistiq — ` +
        `a simple wellness check-in app that lets family members support each other's health without sharing private details.</p>` +
        `<p><a href="${signupUrl}" style="display:inline-block;background:#4c956c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Create your account</a></p>` +
        '<p>See you there,<br>The Holistiq team</p>',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[family-members] Resend request failed:', detail)
  }
}

export async function listFamilyMembers(user: AuthenticatedUser) {
  await ensureUserState(user)
  const members = await listFamilyMemberRows(user.userId)
  return enrichFamilyMembers(members)
}

export async function createFamilyMember(
  user: AuthenticatedUser,
  payload: unknown,
  appUrl: string,
) {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  const name = assertString(body.name, 'name').trim()
  if (!name) {
    throw new ApiError('name must not be empty.', 400)
  }

  const relation = (asOptionalString(body.relation) ?? 'Family member').trim()
  const inviteEmail = asOptionalString(body.invite_email) ?? null
  const invitedUserId = asOptionalString(body.invited_user_id) ?? null
  const canViewGraphs = body.can_view_graphs === true
  const status: FamilyMemberStatus = invitedUserId ? 'active' : 'pending'

  const { data, error } = await getSupabaseAdminClient()
    .from('family_members')
    .insert({
      owner_user_id: user.userId,
      name,
      relation: relation || 'Family member',
      invite_email: inviteEmail,
      invited_user_id: invitedUserId,
      can_view_graphs: canViewGraphs,
      status,
    })
    .select(
      'id, owner_user_id, invited_user_id, invite_email, name, relation, status, can_view_graphs, created_at',
    )
    .single()

  const member = assertSupabaseResult(
    data as FamilyMemberRow | null,
    error,
    'Unable to create the family member.',
  )

  if (inviteEmail) {
    void sendInviteEmail({
      inviteEmail,
      inviterName: user.fullName || user.email || 'Someone',
      memberName: name,
      appUrl,
    })
  }

  const [enriched] = await enrichFamilyMembers([member])
  return enriched
}

export async function updateFamilyMember(
  user: AuthenticatedUser,
  memberId: string,
  payload: unknown,
) {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  const update: Record<string, string | boolean | null> = {}

  if (typeof body.name !== 'undefined') {
    const name = assertString(body.name, 'name').trim()
    if (!name) {
      throw new ApiError('name must not be empty.', 400)
    }
    update.name = name
  }

  if (typeof body.relation !== 'undefined') {
    update.relation = (asOptionalString(body.relation) ?? 'Family member').trim()
  }

  if (typeof body.invite_email !== 'undefined') {
    update.invite_email = asOptionalString(body.invite_email) ?? null
  }

  if (typeof body.invited_user_id !== 'undefined') {
    update.invited_user_id = asOptionalString(body.invited_user_id) ?? null
  }

  if (typeof body.can_view_graphs !== 'undefined') {
    if (typeof body.can_view_graphs !== 'boolean') {
      throw new ApiError('can_view_graphs must be a boolean.', 400)
    }
    update.can_view_graphs = body.can_view_graphs
  }

  if (typeof body.status !== 'undefined') {
    const status = assertString(body.status, 'status')
    if (!VALID_FAMILY_MEMBER_STATUSES.has(status as FamilyMemberStatus)) {
      throw new ApiError('status must be pending, active, or archived.', 400)
    }
    update.status = status
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('family_members')
    .update(update)
    .eq('id', memberId)
    .eq('owner_user_id', user.userId)
    .select(
      'id, owner_user_id, invited_user_id, invite_email, name, relation, status, can_view_graphs, created_at',
    )
    .single()

  if (error && error.message.toLowerCase().includes('json object requested')) {
    throw new ApiError('Family member not found.', 404)
  }

  const member = assertSupabaseResult(
    data as FamilyMemberRow | null,
    error,
    'Unable to update the family member.',
  )
  const [enriched] = await enrichFamilyMembers([member])
  return enriched
}

export async function listConnectedAppSnapshots(user: AuthenticatedUser) {
  await ensureUserState(user)
  return listUserSnapshots(user.userId)
}

export async function upsertConnectedAppSnapshot(
  user: AuthenticatedUser,
  payload: unknown,
) {
  await ensureUserState(user)
  const body = assertObject(payload, 'Request body')
  const snapshotDate = assertDateKey(body.snapshot_date, 'snapshot_date')
  const source = assertString(body.source, 'source')
  const rowPayload = assertObject(body.payload, 'payload')

  if (!VALID_CONNECTED_APP_SOURCES.has(source as ApiConnectedAppSnapshot['source'])) {
    throw new ApiError(
      'source must be myfitnesspal, wearable, medication_tracker, or environment_journal.',
      400,
    )
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('connected_app_snapshots')
    .upsert(
      {
        user_id: user.userId,
        snapshot_date: snapshotDate,
        source,
        payload: rowPayload,
      },
      { onConflict: 'user_id,snapshot_date,source' },
    )
    .select('id, user_id, snapshot_date, source, payload')
    .single()

  return assertSupabaseResult(
    data as ApiConnectedAppSnapshot | null,
    error,
    'Unable to save the connected app snapshot.',
  )
}

export async function getDailySummary(
  user: AuthenticatedUser,
  targetDate: string | null,
): Promise<ApiDailySummary> {
  await ensureUserState(user)
  const sessions = await listUserSessions(user.userId)
  const snapshots = await listUserSnapshots(user.userId)
  const sessionRecord = buildSessionRecord(sessions)
  const connectedApps = aggregateConnectedAppSnapshots(snapshots)
  const dateKey = targetDate ? assertDateKey(targetDate, 'target_date') : getTodayKey()
  const summary = calculateFactorScoresForDate(dateKey, sessionRecord, connectedApps)

  return {
    date: dateKey,
    factor_scores: summary.factorScores,
    total_score: summary.totalScore,
    observations: summary.observations,
  }
}

export async function getTrends(
  user: AuthenticatedUser,
  range: string | null,
): Promise<ApiTrendsResponse> {
  await ensureUserState(user)
  const rangeKey = range ?? 'weekly'
  if (!['weekly', 'monthly', 'yearly'].includes(rangeKey)) {
    throw new ApiError('range must be weekly, monthly, or yearly.', 400)
  }

  const sessions = await listUserSessions(user.userId)
  const snapshots = await listUserSnapshots(user.userId)
  const points = getTrendPoints(
    buildSessionRecord(sessions),
    aggregateConnectedAppSnapshots(snapshots),
    rangeKey as ApiTrendsResponse['range'],
  )

  return {
    range: rangeKey as ApiTrendsResponse['range'],
    points: points.map((point) => ({
      label: point.label,
      period_key: point.periodKey,
      factor_scores: point.factorScores,
      total_score: point.totalScore,
    })),
  }
}
