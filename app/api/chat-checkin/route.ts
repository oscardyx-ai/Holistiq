import Groq from 'groq-sdk'
import type { VoiceCheckinData } from '@/components/VoiceCheckin'

export type CheckinResponse =
  | { stage: 'question'; message: string; extracted: Partial<VoiceCheckinData> }
  | { stage: 'summary'; message: string; finalAnswers: VoiceCheckinData }

export const DEFAULT_QUESTION_PLAN: Record<
  'morning' | 'night',
  Array<{ field: keyof VoiceCheckinData; question: string }>
> = {
  morning: [
    { field: 'sleep',  question: 'How did you sleep last night? (terrible / bad / neutral / good / great)' },
    { field: 'energy', question: 'How is your energy this morning? (terrible / bad / neutral / good / great)' },
    { field: 'mood',   question: 'How would you rate your mood right now on a scale of 1–10?' },
  ],
  night: [
    { field: 'pain',        question: 'Did you experience any pain or discomfort today? (0 = none, 10 = severe)' },
    { field: 'stress',      question: 'How stressed did you feel today? Rate from 1–10.' },
    { field: 'meals',       question: 'How well did you eat today? (not at all / a little / mostly / very)' },
    { field: 'activity',    question: 'How active were you today? (none / light / moderate / high)' },
    { field: 'connection',  question: 'How connected did you feel to others today? (not at all / a little / moderately / very)' },
    { field: 'routine',     question: 'How was your routine today? (offtrack / even / okay / strong)' },
    { field: 'environment', question: 'How would you describe your environment? (very poor / poor / ok / good / excellent)' },
    { field: 'medication',  question: 'Did you take your medication today? (no / partly / yes / N/A)' },
  ],
}

function buildSystemPrompt(
  period: 'morning' | 'night',
  currentFields: Partial<VoiceCheckinData>,
): string {
  const plan = DEFAULT_QUESTION_PLAN[period]
  const fieldLines = plan.map(({ field, question }) => `  - ${field}: ${question}`).join('\n')
  const collectedKeys = plan.map(({ field }) => field).filter((f) => currentFields[f] != null)
  const remainingKeys = plan.map(({ field }) => field).filter((f) => currentFields[f] == null)

  const nullFields = (['mood', 'energy', 'sleep', 'pain', 'stress', 'connection', 'routine', 'meals', 'environment', 'medication', 'activity'] as const)
    .filter((f) => !plan.some((p) => p.field === f))
    .join(', ')

  return `You are a warm, friendly wellness check-in assistant for Holistiq, a personal health app.
Your job: guide the user through their ${period} check-in, one question at a time.

FIELDS TO COLLECT FOR THIS ${period.toUpperCase()} CHECK-IN (ask in order, skip already-collected):
${fieldLines}

ALREADY COLLECTED: ${collectedKeys.length ? collectedKeys.join(', ') : 'none'}
STILL NEEDED: ${remainingKeys.length ? remainingKeys.join(', ') : 'none — all done'}
CURRENT VALUES: ${JSON.stringify(currentFields)}

FIELD VALUE TYPES — extract values matching these exactly:
  mood: integer 1–10
  energy: "terrible" | "bad" | "neutral" | "good" | "great"
  sleep: "terrible" | "bad" | "neutral" | "good" | "great"
  pain: integer 0–10
  stress: integer 1–10
  connection: "not at all" | "a little" | "moderately" | "very"
  routine: "offtrack" | "even" | "okay" | "strong"
  meals: "not at all" | "a little" | "mostly" | "very"
  environment: "very poor" | "poor" | "ok" | "good" | "excellent"
  medication: "no" | "partly" | "yes" | "N/A"
  activity: "none" | "light" | "moderate" | "high"

RULES:
1. If no conversation has happened yet, start with a short, warm greeting then ask the first field in one message.
2. Extract all field values you can from the user's latest message — even if they answer multiple fields at once.
3. Put only NEWLY extracted fields in "extracted". Do not repeat fields already in CURRENT VALUES.
4. When determining if all fields are done, combine CURRENT VALUES + newly extracted fields.
5. If fields remain: return stage "question" with your next question.
6. If all fields are now covered: return stage "summary" with a brief warm closing and ALL 11 finalAnswers (null for fields not in this period's plan).

FIELDS NOT IN THIS PERIOD'S PLAN (set these to null in finalAnswers): ${nullFields || 'none'}

RESPONSE FORMAT — return valid JSON, one of:
{"stage":"question","message":"<acknowledgement + next question>","extracted":{<new fields only>}}
{"stage":"summary","message":"<warm closing>","finalAnswers":{"mood":...,"energy":...,"sleep":...,"pain":...,"stress":...,"connection":...,"routine":...,"meals":...,"environment":...,"medication":...,"activity":...}}

FEW-SHOT EXAMPLES:

User: "I slept pretty well, maybe 7 or 8 hours"
→ {"stage":"question","message":"Glad to hear it! How is your energy feeling this morning?","extracted":{"sleep":"good"}}

User: "I'm totally exhausted, maybe a 3 out of 10 mood, and my back is killing me — pain is around a 7"
→ {"stage":"question","message":"Sorry to hear that — hope things ease up. How stressed did you feel today?","extracted":{"energy":"terrible","mood":3,"pain":7}}

User: "I didn't take my meds, forgot again"
→ {"stage":"summary","message":"Thanks for checking in — you're done for tonight. Here's what I captured.","finalAnswers":{"mood":null,"energy":null,"sleep":null,"pain":3,"stress":6,"connection":"a little","routine":"okay","meals":"mostly","environment":"good","medication":"no","activity":"light"}}
${remainingKeys.length === 0 ? '\nAll fields are already collected. Return stage "summary" now.' : ''}`
}

async function callModel(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  client: Groq,
): Promise<CheckinResponse> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    try {
      const parsed = JSON.parse(raw) as CheckinResponse
      if (parsed.stage !== 'question' && parsed.stage !== 'summary') {
        throw new Error('Invalid stage')
      }
      return parsed
    } catch {
      if (attempt === 1) throw new Error(`Malformed JSON from model after retry: ${raw}`)
    }
  }
  throw new Error('unreachable')
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
  }

  let body: {
    messages: { role: string; content: string }[]
    currentFields: Partial<VoiceCheckinData>
    period: 'morning' | 'night'
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, currentFields, period } = body
  if (period !== 'morning' && period !== 'night') {
    return Response.json({ error: 'Invalid period' }, { status: 400 })
  }

  const safeMessages = messages.map((m) => ({
    role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.content,
  }))

  const systemPrompt = buildSystemPrompt(period, currentFields)
  const client = new Groq({ apiKey })

  try {
    const result = await callModel(safeMessages, systemPrompt, client)
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[chat-checkin] Model call failed:', message)
    return Response.json({ error: 'Model error', detail: message }, { status: 500 })
  }
}
