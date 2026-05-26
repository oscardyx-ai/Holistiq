import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/server/api-error'
import { requireAuthenticatedUser } from '@/lib/server/auth-user'
import {
  createFamilyMember,
  getDailySummary,
  getMe,
  getPrivacySettings,
  getReminderSettings,
  getTrends,
  getWellnessState,
  listCheckIns,
  listConnectedAppSnapshots,
  listFamilyMembers,
  updateFamilyMember,
  updatePrivacySettings,
  updateReminderSettings,
  upsertCheckIn,
  upsertConnectedAppSnapshot,
} from '@/lib/server/wellness-store'

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    throw new ApiError('Request body must be valid JSON.', 400)
  }
}

function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ detail: error.message }, { status: error.statusCode })
  }

  console.error('[api/backend] Unhandled error:', error)
  return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 })
}

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const user = await requireAuthenticatedUser()
  const normalizedPath = path.join('/')

  if (request.method === 'GET' && normalizedPath === 'me') {
    return NextResponse.json(await getMe(user))
  }

  if (request.method === 'GET' && normalizedPath === 'wellness/state') {
    return NextResponse.json(await getWellnessState(user))
  }

  if (normalizedPath === 'check-ins') {
    if (request.method === 'GET') {
      return NextResponse.json(
        await listCheckIns(user, {
          startDate: request.nextUrl.searchParams.get('start_date'),
          endDate: request.nextUrl.searchParams.get('end_date'),
          period: request.nextUrl.searchParams.get('period'),
        }),
      )
    }

    if (request.method === 'POST') {
      return NextResponse.json(await upsertCheckIn(user, await readJsonBody(request)))
    }
  }

  if (normalizedPath === 'settings/reminders') {
    if (request.method === 'GET') {
      return NextResponse.json(await getReminderSettings(user))
    }

    if (request.method === 'PUT') {
      return NextResponse.json(await updateReminderSettings(user, await readJsonBody(request)))
    }
  }

  if (normalizedPath === 'settings/privacy') {
    if (request.method === 'GET') {
      return NextResponse.json(await getPrivacySettings(user))
    }

    if (request.method === 'PUT') {
      return NextResponse.json(await updatePrivacySettings(user, await readJsonBody(request)))
    }
  }

  if (normalizedPath === 'family-members') {
    if (request.method === 'GET') {
      return NextResponse.json(await listFamilyMembers(user))
    }

    if (request.method === 'POST') {
      const origin = new URL(request.url).origin
      return NextResponse.json(
        await createFamilyMember(user, await readJsonBody(request), origin),
        { status: 201 },
      )
    }
  }

  if (request.method === 'PATCH' && path[0] === 'family-members' && path.length === 2) {
    return NextResponse.json(await updateFamilyMember(user, path[1], await readJsonBody(request)))
  }

  if (normalizedPath === 'connected-apps') {
    if (request.method === 'GET') {
      return NextResponse.json(await listConnectedAppSnapshots(user))
    }

    if (request.method === 'POST') {
      return NextResponse.json(await upsertConnectedAppSnapshot(user, await readJsonBody(request)))
    }
  }

  if (request.method === 'GET' && normalizedPath === 'insights/summary') {
    return NextResponse.json(await getDailySummary(user, request.nextUrl.searchParams.get('target_date')))
  }

  if (request.method === 'GET' && normalizedPath === 'insights/trends') {
    return NextResponse.json(await getTrends(user, request.nextUrl.searchParams.get('range')))
  }

  return NextResponse.json({ detail: 'Route not found.' }, { status: 404 })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handleRequest(request, context)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handleRequest(request, context)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handleRequest(request, context)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handleRequest(request, context)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handleRequest(request, context)
  } catch (error) {
    return errorResponse(error)
  }
}
