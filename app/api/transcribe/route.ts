import { DeepgramClient } from '@deepgram/sdk'
import type { ListenV1Response } from '@deepgram/sdk'

export async function POST(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'DEEPGRAM_API_KEY is not configured' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audioFile = formData.get('audio')
  if (!audioFile || !(audioFile instanceof Blob)) {
    return Response.json({ error: 'Missing audio field' }, { status: 400 })
  }

  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = Buffer.from(arrayBuffer)

  const client = new DeepgramClient({ apiKey })

  const response = await client.listen.v1.media.transcribeFile(audioBuffer, {
    model: 'nova-3',
    language: 'en',
    punctuate: true,
    smart_format: true,
  })

  // MediaTranscribeResponse is ListenV1Response | ListenV1AcceptedResponse
  // ListenV1AcceptedResponse is for async (callback) requests, doesn't have results
  let transcript = ''
  if ('results' in response) {
    const sync = response as ListenV1Response
    transcript = sync.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
  }

  return Response.json({ transcript })
}
