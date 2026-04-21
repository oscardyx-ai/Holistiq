import type { ListenV1Response } from '@deepgram/sdk'

export async function POST(request: Request) {
  console.log('[transcribe] Request received')

  const apiKey = process.env.DEEPGRAM_API_KEY
  console.log('[transcribe] DEEPGRAM_API_KEY present:', !!apiKey)
  if (!apiKey) {
    return Response.json({ error: 'DEEPGRAM_API_KEY is not configured' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
    console.error('[transcribe] Failed to parse form data:', e)
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audioFile = formData.get('audio')
  if (!audioFile || !(audioFile instanceof Blob)) {
    return Response.json({ error: 'Missing audio field' }, { status: 400 })
  }

  const contentType = (audioFile.type || 'audio/webm').split(';')[0]
  console.log('[transcribe] Audio blob size:', audioFile.size)
  console.log('[transcribe] Audio content type:', contentType)

  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = Buffer.from(arrayBuffer)

  const deepgramUrl = new URL('https://api.deepgram.com/v1/listen')
  deepgramUrl.searchParams.set('language', 'en')
  deepgramUrl.searchParams.set('model', 'nova-3')
  deepgramUrl.searchParams.set('punctuate', 'true')
  deepgramUrl.searchParams.set('smart_format', 'true')

  const response = await fetch(deepgramUrl, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': contentType,
    },
    body: audioBuffer,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[transcribe] Deepgram error:', response.status, errorBody)
    return Response.json(
      {
        error: 'Transcription failed',
        detail: errorBody,
      },
      { status: response.status }
    )
  }

  let transcript = ''
  const data = (await response.json()) as ListenV1Response
  transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

  console.log('[transcribe] Transcript:', transcript)
  return Response.json({ transcript })
}
