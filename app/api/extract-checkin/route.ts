import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are extracting wellness check-in data from a voice transcript. Map what the user said to these exact fields and allowed values. If a field is not mentioned or cannot be confidently inferred, return null for that field. Only return valid JSON, no explanation.

Fields and allowed values:
- mood: number 1-10
- energy: "terrible" | "bad" | "neutral" | "good" | "great"
- sleep: "terrible" | "bad" | "neutral" | "good" | "great"
- pain: number 0-10
- stress: number 1-10
- connection: "not at all" | "a little" | "moderately" | "very"
- routine: "offtrack" | "even" | "okay" | "strong"
- meals: "not at all" | "a little" | "mostly" | "very"
- environment: "very poor" | "poor" | "ok" | "good" | "excellent"
- medication: "no" | "partly" | "yes" | "N/A"
- activity: "none" | "light" | "moderate" | "high"

Return ONLY a JSON object with these 11 keys. Use null for any field that cannot be confidently extracted.`

export interface CheckInExtraction {
  mood: number | null
  energy: 'terrible' | 'bad' | 'neutral' | 'good' | 'great' | null
  sleep: 'terrible' | 'bad' | 'neutral' | 'good' | 'great' | null
  pain: number | null
  stress: number | null
  connection: 'not at all' | 'a little' | 'moderately' | 'very' | null
  routine: 'offtrack' | 'even' | 'okay' | 'strong' | null
  meals: 'not at all' | 'a little' | 'mostly' | 'very' | null
  environment: 'very poor' | 'poor' | 'ok' | 'good' | 'excellent' | null
  medication: 'no' | 'partly' | 'yes' | 'N/A' | null
  activity: 'none' | 'light' | 'moderate' | 'high' | null
}

export async function POST(request: Request) {
  console.log('[extract-checkin] Request received')

  const apiKey = process.env.GROQ_API_KEY
  console.log('[extract-checkin] GROQ_API_KEY present:', !!apiKey)
  if (!apiKey) {
    console.error('[extract-checkin] GROQ_API_KEY is not set in environment')
    return Response.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
  }

  let body: { transcript?: string }
  try {
    body = await request.json()
  } catch (e) {
    console.error('[extract-checkin] Failed to parse request body:', e)
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const transcript = body.transcript?.trim()
  console.log('[extract-checkin] Transcript length:', transcript?.length ?? 0)
  console.log('[extract-checkin] Transcript preview:', transcript?.slice(0, 100))

  if (!transcript) {
    console.error('[extract-checkin] Empty or missing transcript')
    return Response.json({ error: 'Missing transcript' }, { status: 400 })
  }

  console.log('[extract-checkin] Calling Groq API with model llama3-8b-8192')
  let completion: Awaited<ReturnType<Groq['chat']['completions']['create']>>
  try {
    const client = new Groq({ apiKey })
    completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    })
  } catch (e) {
    console.error('[extract-checkin] Groq API call failed:', e)
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ error: 'Groq API error', detail: message }, { status: 502 })
  }

  const raw = completion.choices[0]?.message?.content ?? '{}'
  console.log('[extract-checkin] Raw Groq response:', raw)

  let extracted: CheckInExtraction
  try {
    extracted = JSON.parse(raw) as CheckInExtraction
    console.log('[extract-checkin] Parsed extraction:', extracted)
  } catch (e) {
    console.error('[extract-checkin] JSON parse failed:', e, 'raw:', raw)
    return Response.json({ error: 'Failed to parse model response', raw }, { status: 500 })
  }

  return Response.json(extracted)
}
