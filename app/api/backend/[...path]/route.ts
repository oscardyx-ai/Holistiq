import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000'

function buildBackendUrl(pathSegments: string[], request: NextRequest) {
  const backendUrl = new URL(
    `/api/v1/${pathSegments.map(encodeURIComponent).join('/')}`,
    BACKEND_API_URL.endsWith('/') ? BACKEND_API_URL : `${BACKEND_API_URL}/`
  )

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value)
  })

  return backendUrl
}

async function proxyToBackend(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${session.access_token}`)

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('content-type', contentType)
  }

  let response: Response

  try {
    response = await fetch(buildBackendUrl(path, request), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
      cache: 'no-store',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown backend connectivity error.'
    return NextResponse.json(
      {
        error: 'Backend request failed.',
        detail: message,
      },
      { status: 502 }
    )
  }

  const responseHeaders = new Headers()
  const responseContentType = response.headers.get('content-type')
  if (responseContentType) {
    responseHeaders.set('content-type', responseContentType)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(request, context)
}
