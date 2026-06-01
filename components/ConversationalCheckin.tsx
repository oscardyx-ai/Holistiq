'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { VoiceCheckinData } from './VoiceCheckin'
import type { CheckinResponse } from '@/app/api/chat-checkin/route'

// ── Web Speech API types ──────────────────────────────────────────────────────

interface SpeechRecognitionEventLike extends Event {
  readonly results: {
    readonly length: number
    readonly [index: number]: { readonly [index: number]: { transcript: string } }
  }
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return (
    (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .webkitSpeechRecognition
  )
}

// ── Option constants (mirrors VoiceCheckin) ───────────────────────────────────

const ENERGY_OPTIONS      = ['terrible', 'bad', 'neutral', 'good', 'great'] as const
const SLEEP_OPTIONS       = ['terrible', 'bad', 'neutral', 'good', 'great'] as const
const CONNECTION_OPTIONS  = ['not at all', 'a little', 'moderately', 'very'] as const
const ROUTINE_OPTIONS     = ['offtrack', 'even', 'okay', 'strong'] as const
const MEALS_OPTIONS       = ['not at all', 'a little', 'mostly', 'very'] as const
const ENVIRONMENT_OPTIONS = ['very poor', 'poor', 'ok', 'good', 'excellent'] as const
const MEDICATION_OPTIONS  = ['no', 'partly', 'yes', 'N/A'] as const
const ACTIVITY_OPTIONS    = ['none', 'light', 'moderate', 'high'] as const

// Fields shown in the preview form, keyed by period (mirrors DEFAULT_QUESTION_PLAN order)
const PREVIEW_FIELDS: Record<'morning' | 'night', (keyof VoiceCheckinData)[]> = {
  morning: ['sleep', 'energy', 'mood'],
  night:   ['pain', 'stress', 'meals', 'activity', 'connection', 'routine', 'environment', 'medication'],
}

// ── Shared form sub-components ────────────────────────────────────────────────

function SliderField({
  label, value, min, max, onChange, missing,
}: {
  label: string; value: number | null; min: number; max: number
  onChange: (v: number) => void; missing: boolean
}) {
  return (
    <div className={`rounded-[1.2rem] border p-4 transition ${missing ? 'border-[#ffb8ae] bg-[#fff2f0]' : 'border-[#e5e5e5] bg-white'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {missing
          ? <span className="rounded-full bg-[#ff6f59] px-2 py-0.5 text-xs font-medium text-white">fill in</span>
          : <span className="text-sm font-bold text-[#4c956c]">{value}</span>}
      </div>
      <input
        type="range" min={min} max={max} value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#4c956c]"
      />
      <div className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function ChoiceField<T extends string>({
  label, options, value, onChange, missing,
}: {
  label: string; options: readonly T[]; value: T | null
  onChange: (v: T) => void; missing: boolean
}) {
  return (
    <div className={`rounded-[1.2rem] border p-4 transition ${missing ? 'border-[#ffb8ae] bg-[#fff2f0]' : 'border-[#e5e5e5] bg-white'}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {missing && <span className="rounded-full bg-[#ff6f59] px-2 py-0.5 text-xs font-medium text-white">fill in</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt} type="button" onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              opt === value
                ? 'border-[#4c956c] bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white'
                : 'border-[#e5e5e5] bg-white text-stone-600 hover:border-[#b8dcc9]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'chat' | 'preview' | 'done'

interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

const EMPTY_FORM: VoiceCheckinData = {
  mood: null, energy: null, sleep: null, pain: null, stress: null,
  connection: null, routine: null, meals: null, environment: null,
  medication: null, activity: null,
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSave: (data: VoiceCheckinData) => void | Promise<void>
  onCancel: () => void
  period: 'morning' | 'night'
}

export default function ConversationalCheckin({ onSave, onCancel, period }: Props) {
  const [phase, setPhase] = useState<Phase>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentFields, setCurrentFields] = useState<Partial<VoiceCheckinData>>({})
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
  const [form, setForm] = useState<VoiceCheckinData>(EMPTY_FORM)

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    setHasSpeechSupport(!!getSpeechRecognitionCtor())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Kick off the greeting on mount (StrictMode-safe via ref guard)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    void fetchNext([], {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchNext(msgs: ChatMessage[], fields: Partial<VoiceCheckinData>) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, currentFields: fields, period }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as CheckinResponse

      if (data.stage === 'question') {
        const merged = { ...fields, ...data.extracted }
        setCurrentFields(merged)
        setMessages([...msgs, { role: 'assistant', content: data.message }])
      } else {
        setMessages([...msgs, { role: 'assistant', content: data.message }])
        setForm(data.finalAnswers)
        // Let the user read the closing message before transitioning
        setTimeout(() => setPhase('preview'), 1200)
      }
    } catch {
      setMessages([
        ...msgs,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSend() {
    const text = inputText.trim()
    if (!text || isLoading) return
    setInputText('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMsgs = [...messages, userMsg]
    setMessages(updatedMsgs)
    await fetchNext(updatedMsgs, currentFields)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
      return
    }
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) setInputText(transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  function setField<K extends keyof VoiceCheckinData>(key: K, value: VoiceCheckinData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const previewFields = PREVIEW_FIELDS[period]
  const missingCount = previewFields.filter((f) => form[f] === null).length

  return (
    <div className="flex flex-col px-4 pb-5">
      <AnimatePresence mode="wait">

        {phase === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Message list */}
            <div
              ref={scrollRef}
              className="flex flex-col gap-2 overflow-y-auto py-3"
              style={{ maxHeight: '52vh' }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-[1.2rem] px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white'
                        : 'rounded-bl-md bg-stone-100 text-stone-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-[1.2rem] rounded-bl-md bg-stone-100 px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-stone-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 rounded-[1.4rem] border border-stone-200 bg-white px-4 py-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response…"
                disabled={isLoading}
                className="min-w-0 flex-1 bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400 disabled:opacity-50"
              />
              {hasSpeechSupport && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  aria-label={isListening ? 'Stop listening' : 'Speak'}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
                    isListening
                      ? 'bg-[#d94f4f] text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 18.93A8.001 8.001 0 0 1 4 12H6a6 6 0 0 0 12 0h2a8.001 8.001 0 0 1-6.5 7.93V22h-3v-2.07z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading || !inputText.trim()}
                aria-label="Send"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4c956c] text-white transition hover:bg-[#3a7d56] disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="text-center text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {phase === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 pt-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-800">Review Check-in</h2>
                <p className="mt-0.5 text-xs text-stone-400">
                  {missingCount > 0
                    ? `${missingCount} field${missingCount > 1 ? 's' : ''} need your input`
                    : 'All fields extracted — edit anything below'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhase('chat')}
                className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:border-[#b8dcc9]"
              >
                Edit answers
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {previewFields.includes('sleep') && (
                <ChoiceField label="Sleep" options={SLEEP_OPTIONS} value={form.sleep} onChange={(v) => setField('sleep', v)} missing={form.sleep === null} />
              )}
              {previewFields.includes('energy') && (
                <ChoiceField label="Energy" options={ENERGY_OPTIONS} value={form.energy} onChange={(v) => setField('energy', v)} missing={form.energy === null} />
              )}
              {previewFields.includes('mood') && (
                <SliderField label="Mood" value={form.mood} min={1} max={10} onChange={(v) => setField('mood', v)} missing={form.mood === null} />
              )}
              {previewFields.includes('pain') && (
                <SliderField label="Pain" value={form.pain} min={0} max={10} onChange={(v) => setField('pain', v)} missing={form.pain === null} />
              )}
              {previewFields.includes('stress') && (
                <SliderField label="Stress" value={form.stress} min={1} max={10} onChange={(v) => setField('stress', v)} missing={form.stress === null} />
              )}
              {previewFields.includes('meals') && (
                <ChoiceField label="Meals" options={MEALS_OPTIONS} value={form.meals} onChange={(v) => setField('meals', v)} missing={form.meals === null} />
              )}
              {previewFields.includes('activity') && (
                <ChoiceField label="Activity" options={ACTIVITY_OPTIONS} value={form.activity} onChange={(v) => setField('activity', v)} missing={form.activity === null} />
              )}
              {previewFields.includes('connection') && (
                <ChoiceField label="Connection" options={CONNECTION_OPTIONS} value={form.connection} onChange={(v) => setField('connection', v)} missing={form.connection === null} />
              )}
              {previewFields.includes('routine') && (
                <ChoiceField label="Routine" options={ROUTINE_OPTIONS} value={form.routine} onChange={(v) => setField('routine', v)} missing={form.routine === null} />
              )}
              {previewFields.includes('environment') && (
                <ChoiceField label="Environment" options={ENVIRONMENT_OPTIONS} value={form.environment} onChange={(v) => setField('environment', v)} missing={form.environment === null} />
              )}
              {previewFields.includes('medication') && (
                <ChoiceField label="Medication" options={MEDICATION_OPTIONS} value={form.medication} onChange={(v) => setField('medication', v)} missing={form.medication === null} />
              )}
            </div>

            <div className="flex gap-3 pb-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-full border border-[#e5e5e5] bg-white py-3 text-sm font-semibold text-stone-600 transition hover:border-[#b8dcc9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void onSave(form); setPhase('done') }}
                className="flex-1 rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(76,149,108,0.25)] transition hover:-translate-y-0.5 active:translate-y-0"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 px-6 py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e0f5ec]">
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-display text-xl font-bold text-stone-800">Saved!</p>
            <p className="text-sm text-stone-500">Your check-in has been recorded.</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
