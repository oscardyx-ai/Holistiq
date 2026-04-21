'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
export interface VoiceCheckinData {
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

type Phase = 'prompt' | 'recording' | 'processing' | 'preview' | 'done'

// Minimal Web Speech API interfaces (not guaranteed in all TS targets)
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly [index: number]: { transcript: string }
}
interface SpeechRecognitionResultList {
  readonly length: number
  readonly [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  start(): void
  stop(): void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const ENERGY_OPTIONS = ['terrible', 'bad', 'neutral', 'good', 'great'] as const
const SLEEP_OPTIONS = ['terrible', 'bad', 'neutral', 'good', 'great'] as const
const CONNECTION_OPTIONS = ['not at all', 'a little', 'moderately', 'very'] as const
const ROUTINE_OPTIONS = ['offtrack', 'even', 'okay', 'strong'] as const
const MEALS_OPTIONS = ['not at all', 'a little', 'mostly', 'very'] as const
const ENVIRONMENT_OPTIONS = ['very poor', 'poor', 'ok', 'good', 'excellent'] as const
const MEDICATION_OPTIONS = ['no', 'partly', 'yes', 'N/A'] as const
const ACTIVITY_OPTIONS = ['none', 'light', 'moderate', 'high'] as const

function SliderField({
  label, value, min, max, onChange, missing,
}: {
  label: string; value: number | null; min: number; max: number
  onChange: (v: number) => void; missing: boolean
}) {
  return (
    <div className={`rounded-[1.2rem] border p-4 transition ${missing ? 'border-[#f0c98a] bg-[#fffbf3]' : 'border-[#e8e1d3] bg-white'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {missing
          ? <span className="rounded-full bg-[#f5e0b5] px-2 py-0.5 text-xs font-medium text-[#9a6a1a]">fill in</span>
          : <span className="text-sm font-bold text-[#6b8f56]">{value}</span>}
      </div>
      <input
        type="range" min={min} max={max} value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#6b8f56]"
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
    <div className={`rounded-[1.2rem] border p-4 transition ${missing ? 'border-[#f0c98a] bg-[#fffbf3]' : 'border-[#e8e1d3] bg-white'}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {missing && <span className="rounded-full bg-[#f5e0b5] px-2 py-0.5 text-xs font-medium text-[#9a6a1a]">fill in</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt} type="button" onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              opt === value
                ? 'border-[#6b8f56] bg-[#6b8f56] text-white'
                : 'border-[#e8e1d3] bg-white text-stone-600 hover:border-[#c5d6b8]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function PulseRing() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-[#d94f4f]"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

interface Props {
  onSave: (data: VoiceCheckinData) => void
  onCancel?: () => void
}

export default function VoiceCheckin({ onSave, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('prompt')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<VoiceCheckinData>({
    mood: null, energy: null, sleep: null, pain: null, stress: null,
    connection: null, routine: null, meals: null, environment: null,
    medication: null, activity: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')

  const startRecording = useCallback(async () => {
    setError(null)
    setLiveTranscript('')
    setFinalTranscript('')
    transcriptRef.current = ''
    audioChunksRef.current = []

    // Web Speech API for live display
    const SpeechRecognitionCtor: SpeechRecognitionConstructor | undefined =
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .webkitSpeechRecognition

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      let committed = ''
      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) committed += result[0].transcript + ' '
          else interim += result[0].transcript
        }
        const combined = committed + interim
        transcriptRef.current = combined
        setLiveTranscript(combined)
      }
      recognition.onerror = () => { /* fall back to Deepgram */ }
      recognition.start()
      recognitionRef.current = recognition
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg;codecs=opus'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.start(250)
      mediaRecorderRef.current = recorder
      setPhase('recording')
    } catch {
      setError('Microphone access denied. Please allow microphone and try again.')
      recognitionRef.current?.stop()
    }
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach((t) => t.stop())
      setPhase('processing')

      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })

      // Transcribe via Deepgram, fall back to Web Speech
      let transcript = transcriptRef.current
      try {
        const fd = new FormData()
        fd.append('audio', audioBlob, 'recording.webm')
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
        if (res.ok) {
          const data = (await res.json()) as { transcript: string }
          if (data.transcript?.trim()) transcript = data.transcript
        }
      } catch { /* use Web Speech fallback */ }

      setFinalTranscript(transcript)

      if (!transcript.trim()) {
        setError('No speech detected. Please try again.')
        setPhase('prompt')
        return
      }

      // Extract structured fields via Groq
      try {
        const res = await fetch('/api/extract-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })
        if (!res.ok) throw new Error('Extraction failed')
        const extracted = (await res.json()) as VoiceCheckinData
        setForm(extracted)
        setPhase('preview')
      } catch {
        setError('Failed to extract check-in data. Please try again.')
        setPhase('prompt')
      }
    }

    recorder.stop()
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function setField<K extends keyof VoiceCheckinData>(key: K, value: VoiceCheckinData[K]) {
    setForm((prev: VoiceCheckinData) => ({ ...prev, [key]: value }))
  }

  const missingCount = Object.values(form).filter((v) => v === null).length

  return (
    <div className="flex min-h-full flex-col">
      <AnimatePresence mode="wait">

        {phase === 'prompt' && (
          <motion.div key="prompt"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 px-6 py-10 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5e5]">
              <span className="text-3xl">🎙️</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-800">Voice Check-in</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
                Talk about how you slept, your energy, mood, pain, stress, meals, activity, and how your day went.
              </p>
            </div>
            {error && (
              <p className="rounded-[1rem] border border-[#f5c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#c0392b]">
                {error}
              </p>
            )}
            <button
              type="button" onClick={startRecording}
              className="rounded-full bg-[#6b8f56] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(107,143,86,0.28)] transition hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Recording
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm text-stone-400 hover:text-stone-600">
                Cancel
              </button>
            )}
          </motion.div>
        )}

        {phase === 'recording' && (
          <motion.div key="recording"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 px-6 py-10"
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <PulseRing />
              <button
                type="button" onClick={stopRecording}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#d94f4f] shadow-[0_8px_24px_rgba(217,79,79,0.35)] transition hover:scale-105 active:scale-95"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>
            <p className="text-sm font-medium text-stone-500">Tap to stop recording</p>
            <div className="w-full max-w-sm rounded-[1.2rem] border border-[#e8e1d3] bg-white/80 p-4 backdrop-blur-sm">
              {liveTranscript
                ? <p className="text-sm leading-relaxed text-stone-700">{liveTranscript}<span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#6b8f56]" /></p>
                : <p className="text-sm text-stone-400">Listening…</p>}
            </div>
          </motion.div>
        )}

        {phase === 'processing' && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 px-6 py-16 text-center"
          >
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-[#e8e1d3] border-t-[#6b8f56]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm font-medium text-stone-500">Analysing your check-in…</p>
            {finalTranscript && (
              <p className="max-w-xs text-xs leading-relaxed text-stone-400">
                &ldquo;{finalTranscript.slice(0, 120)}{finalTranscript.length > 120 ? '…' : ''}&rdquo;
              </p>
            )}
          </motion.div>
        )}

        {phase === 'preview' && (
          <motion.div key="preview"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex flex-col gap-4 px-4 pb-8 pt-4"
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
                onClick={() => { setPhase('prompt'); setLiveTranscript(''); setFinalTranscript('') }}
                className="rounded-full border border-[#e8e1d3] bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:border-[#c5d6b8]"
              >
                Re-record
              </button>
            </div>

            {finalTranscript && (
              <div className="rounded-[1rem] border border-[#e8e1d3] bg-[#fdfaf5] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Transcript</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{finalTranscript}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <SliderField label="Mood" value={form.mood} min={1} max={10} onChange={(v) => setField('mood', v)} missing={form.mood === null} />
              <ChoiceField label="Energy" options={ENERGY_OPTIONS} value={form.energy} onChange={(v) => setField('energy', v)} missing={form.energy === null} />
              <ChoiceField label="Sleep" options={SLEEP_OPTIONS} value={form.sleep} onChange={(v) => setField('sleep', v)} missing={form.sleep === null} />
              <SliderField label="Pain" value={form.pain} min={0} max={10} onChange={(v) => setField('pain', v)} missing={form.pain === null} />
              <SliderField label="Stress" value={form.stress} min={1} max={10} onChange={(v) => setField('stress', v)} missing={form.stress === null} />
              <ChoiceField label="Connection" options={CONNECTION_OPTIONS} value={form.connection} onChange={(v) => setField('connection', v)} missing={form.connection === null} />
              <ChoiceField label="Routine" options={ROUTINE_OPTIONS} value={form.routine} onChange={(v) => setField('routine', v)} missing={form.routine === null} />
              <ChoiceField label="Meals" options={MEALS_OPTIONS} value={form.meals} onChange={(v) => setField('meals', v)} missing={form.meals === null} />
              <ChoiceField label="Environment" options={ENVIRONMENT_OPTIONS} value={form.environment} onChange={(v) => setField('environment', v)} missing={form.environment === null} />
              <ChoiceField label="Medication" options={MEDICATION_OPTIONS} value={form.medication} onChange={(v) => setField('medication', v)} missing={form.medication === null} />
              <ChoiceField label="Activity" options={ACTIVITY_OPTIONS} value={form.activity} onChange={(v) => setField('activity', v)} missing={form.activity === null} />
            </div>

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <button
                  type="button" onClick={onCancel}
                  className="flex-1 rounded-full border border-[#e8e1d3] bg-white py-3 text-sm font-semibold text-stone-600 transition hover:border-[#c5d6b8]"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => { onSave(form); setPhase('done') }}
                className="flex-1 rounded-full bg-[#6b8f56] py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(107,143,86,0.25)] transition hover:-translate-y-0.5 active:translate-y-0"
              >
                Save Check-in
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 px-6 py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5e5]">
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
