'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import LogoWordmark from '@/components/LogoWordmark'
import SafetyScreen from '@/components/SafetyScreen'
import {
  AnswerValue,
  CheckInPeriod,
  FACTOR_CONFIG,
  QuestionDefinition,
  SubstanceUseAnswer,
  copyPreviousAnswers,
  createCheckInAnswers,
  formatLongDate,
  getAnswersForPeriod,
  getPeriodLabel,
  getQuestionsForPeriod,
  getSessionForDate,
  WellnessState,
} from '@/components/checkInData'
import { useCheckInWindow } from '@/lib/use-check-in-window'
import { createEmptyWellnessState, fetchWellnessState, saveCheckIn } from '@/lib/wellness-api'
import { getTier, getQuestionsForSession, getFollowUpQuestion } from '@/lib/questionnaire/loader'
import type { Question as NewQuestion, CheckInTier, PatientFlag } from '@/lib/questionnaire/types'
import { evaluateTriggers, requiresSafetyPause } from '@/lib/questionnaire/engine'

function getChoiceColumns(count: number) {
  if (count <= 2) {
    return 'sm:grid-cols-2'
  }

  if (count === 3) {
    return 'sm:grid-cols-3'
  }

  return 'sm:grid-cols-2'
}

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error) || !error.message) {
    return fallback
  }

  return error.message.trim().startsWith('<') ? fallback : error.message
}

function ChoiceGrid({
  options,
  onSelect,
  value,
  columns,
}: {
  options: string[]
  onSelect: (value: string) => void
  value: string
  columns: string
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {options.map((option) => {
        const selected = option === value

        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-[1.5rem] border px-4 py-5 text-left transition ${
              selected
                ? 'border-[#4c956c] bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white shadow-[0_12px_24px_rgba(76,149,108,0.22)]'
                : 'border-[#e5e5e5] bg-white text-stone-700 hover:-translate-y-0.5 hover:border-[#d0d0d0]'
            }`}
          >
            <span className="text-base font-semibold">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function SliderStep({
  question,
  value,
  onChange,
}: {
  question: Extract<QuestionDefinition, { kind: 'slider' }>
  value: number
  onChange: (value: number) => void
}) {
  const percentage = ((value - question.min) / Math.max(1, question.max - question.min)) * 100

  return (
    <div className="space-y-6">
      <div className="rounded-[1.7rem] bg-[#f0f0f0] p-6">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[#4c956c]"
          style={{
            background: `linear-gradient(90deg, #4c956c ${percentage}%, #e0e0e0 ${percentage}%)`,
          }}
        />

        <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${question.ticks.length}, minmax(0, 1fr))` }}>
          {question.ticks.map((tickLabel, index) => {
            const tickValue = question.min + index
            const selected = tickValue === value

            return (
              <button
                key={tickLabel}
                type="button"
                onClick={() => onChange(tickValue)}
                className={`rounded-xl border px-1 py-2 text-xs font-semibold transition ${
                  selected
                    ? 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                    : 'border-[#e5e5e5] bg-white text-stone-500'
                }`}
              >
                {tickLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#efefef] bg-white px-5 py-4">
        <p className="text-sm text-stone-500">Selected value</p>
        <p className="font-display mt-2 text-4xl text-stone-900">{value}</p>
      </div>
    </div>
  )
}

function MultiSelectStep({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (nextValue: string[]) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value.includes(option)

        return (
          <button
            key={option}
            type="button"
            onClick={() =>
              onChange(
                selected ? value.filter((item) => item !== option) : [...value, option]
              )
            }
            className={`rounded-[1.5rem] border px-4 py-5 text-left transition ${
              selected
                ? 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                : 'border-[#e5e5e5] bg-white text-stone-700'
            }`}
          >
            <span className="text-base font-semibold">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function SubstanceStep({
  question,
  value,
  onChange,
}: {
  question: Extract<QuestionDefinition, { kind: 'substance_use' }>
  value: SubstanceUseAnswer
  onChange: (nextValue: SubstanceUseAnswer) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4c956c]">
          Select all that apply
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const selected = value.substances.includes(option)

            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    substances: selected
                      ? value.substances.filter((item) => item !== option)
                      : [...value.substances, option],
                  })
                }
                className={`rounded-[1.5rem] border px-4 py-5 text-left transition ${
                  selected
                    ? 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                    : 'border-[#e5e5e5] bg-white text-stone-700'
                }`}
              >
                <span className="text-base font-semibold">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4c956c]">
          Frequency
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {question.frequencyOptions.map((option) => {
            const selected = option === value.frequency

            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...value, frequency: option })}
                className={`rounded-[1.5rem] border px-4 py-5 text-left transition ${
                  selected
                    ? 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                    : 'border-[#e5e5e5] bg-white text-stone-700'
                }`}
              >
                <span className="text-base font-semibold">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#e5e5e5] bg-white px-5 py-4">
        <label className="block text-sm font-semibold text-stone-900">Other substance</label>
        <input
          value={value.customSubstance}
          onChange={(event) => onChange({ ...value, customSubstance: event.target.value })}
          placeholder="Type a substance if it is not listed"
          className="mt-3 w-full rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none"
        />
      </div>
    </div>
  )
}

// ── New questionnaire rendering ───────────────────────────────────────────────

function NewChoiceGrid({
  question,
  value,
  onSelect,
}: {
  question: NewQuestion
  value: string[]
  onSelect: (ids: string[]) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.options.map((opt) => {
        const selected = value.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              if (question.responseType === 'single_choice') {
                onSelect([opt.id])
              } else {
                onSelect(
                  selected ? value.filter(id => id !== opt.id) : [...value, opt.id]
                )
              }
            }}
            className={`rounded-[1.5rem] border px-4 py-5 text-left transition ${
              selected
                ? question.responseType === 'single_choice'
                  ? 'border-[#4c956c] bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white shadow-[0_12px_24px_rgba(76,149,108,0.22)]'
                  : 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                : 'border-[#e5e5e5] bg-white text-stone-700 hover:-translate-y-0.5 hover:border-[#d0d0d0]'
            }`}
          >
            <span className="text-base font-semibold">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CheckInExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedPeriod = searchParams.get('period')
  const checkInWindow = useCheckInWindow()
  const period: CheckInPeriod = requestedPeriod === 'weekly' ? 'weekly' : checkInWindow.activePeriod
  const entryDateKey = checkInWindow.activeDateKey

  const [state, setState] = useState<WellnessState>(createEmptyWellnessState)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => createCheckInAnswers(period))
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingState, setIsLoadingState] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // New questionnaire system state
  const [tier, setTierState] = useState<CheckInTier>('beginner')
  const [newSystemActive, setNewSystemActive] = useState(false)
  const [newQuestions, setNewQuestions] = useState<NewQuestion[]>([])
  const [newAnswers, setNewAnswers] = useState<Record<string, string[]>>({})
  const [pendingFollowUpIds, setPendingFollowUpIds] = useState<string[]>([])
  const [safetyFlags, setSafetyFlags] = useState<PatientFlag[]>([])
  const [showSafetyScreen, setShowSafetyScreen] = useState(false)

  const shouldIncludeMorningQuestions =
    period === 'night' && !getSessionForDate(state.sessions, entryDateKey, 'morning')
  const questions = useMemo(
    () =>
      getQuestionsForPeriod(period, answers, {
        includeMorningQuestions: shouldIncludeMorningQuestions,
      }),
    [period, answers, shouldIncludeMorningQuestions]
  )

  // New system: flat rendered question list (base + injected follow-ups)
  const renderedNewQuestions = useMemo<NewQuestion[]>(() => {
    if (!newSystemActive) return []
    const result: NewQuestion[] = [...newQuestions]
    const toInsert: Array<{ afterId: string; q: NewQuestion }> = []
    for (const id of pendingFollowUpIds) {
      const fq = getFollowUpQuestion(id)
      if (fq) toInsert.push({ afterId: '', q: fq })
    }
    // Append follow-ups at end for now (triggered ones are added dynamically)
    return [...result, ...toInsert.map(t => t.q)]
  }, [newSystemActive, newQuestions, pendingFollowUpIds])

  const activeQuestions = newSystemActive ? renderedNewQuestions : questions
  const currentNewStep = newSystemActive ? renderedNewQuestions[Math.min(stepIndex, Math.max(renderedNewQuestions.length - 1, 0))] : null
  const currentStep = newSystemActive ? null : questions[Math.min(stepIndex, Math.max(questions.length - 1, 0))]
  const progress = activeQuestions.length ? ((stepIndex + 1) / activeQuestions.length) * 100 : 0
  const previousAnswers =
    period === 'weekly' || shouldIncludeMorningQuestions
      ? null
      : copyPreviousAnswers(state.sessions, entryDateKey, period)

  useEffect(() => {
    const t = getTier()
    setTierState(t)
    const timing = period === 'morning' ? 'morning' : period === 'weekly' ? 'weekly' : 'night'
    const qs = getQuestionsForSession(t, timing)
    if (qs.length > 0) {
      setNewSystemActive(true)
      setNewQuestions(qs)
    }
  }, [period])

  useEffect(() => {
    let cancelled = false

    async function loadState() {
      setIsLoadingState(true)
      setLoadError(null)

      try {
        const nextState = await fetchWellnessState()
        if (cancelled) {
          return
        }

        setState(nextState)
        const includeMorning =
          period === 'night' && !getSessionForDate(nextState.sessions, entryDateKey, 'morning')
        const nextAnswers = {
          ...createCheckInAnswers(period, { includeMorningQuestions: includeMorning }),
          ...(includeMorning
            ? (getSessionForDate(nextState.sessions, entryDateKey, 'morning')?.answers ?? {})
            : {}),
          ...(getSessionForDate(nextState.sessions, entryDateKey, period)?.answers ?? {}),
        }

        setAnswers(nextAnswers)
        setStepIndex(0)
      } catch (error) {
        if (!cancelled) {
          setLoadError(getFriendlyErrorMessage(error, 'Could not load your latest check-in data.'))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingState(false)
        }
      }
    }

    void loadState()

    return () => {
      cancelled = true
    }
  }, [entryDateKey, period])

  async function finishCheckIn(nextAnswers: Record<string, AnswerValue>) {
    setIsSaving(true)

    try {
      const completedAt = new Date().toISOString()

      // Merge new-system answers (string[]) into the answers record as AnswerValue
      const mergedAnswers: Record<string, AnswerValue> = { ...nextAnswers }
      for (const [id, selectedIds] of Object.entries(newAnswers)) {
        mergedAnswers[id] = selectedIds.length === 1 ? selectedIds[0] : selectedIds
      }

      if (period === 'night' && shouldIncludeMorningQuestions) {
        await Promise.all([
          saveCheckIn({
            entryDate: entryDateKey,
            period: 'morning',
            answers: getAnswersForPeriod(mergedAnswers, 'morning'),
            completedAt,
          }),
          saveCheckIn({
            entryDate: entryDateKey,
            period: 'night',
            answers: getAnswersForPeriod(mergedAnswers, 'night'),
            completedAt,
          }),
        ])
      } else {
        await saveCheckIn({
          entryDate: entryDateKey,
          period,
          answers: getAnswersForPeriod(mergedAnswers, period),
          completedAt,
        })
      }

      router.push('/')
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Could not save your check-in just now.'))
      setIsSaving(false)
    }
  }

  function goNext() {
    if (newSystemActive) {
      if (stepIndex >= renderedNewQuestions.length - 1) {
        void finishCheckIn(answers)
        return
      }
      setStepIndex((current) => Math.min(current + 1, renderedNewQuestions.length - 1))
      return
    }
    if (stepIndex >= questions.length - 1) {
      void finishCheckIn(answers)
      return
    }
    setStepIndex((current) => Math.min(current + 1, questions.length - 1))
  }

  function applyNewAnswer(questionId: string, selectedIds: string[], autoAdvance = false) {
    const nextNewAnswers = { ...newAnswers, [questionId]: selectedIds }
    setNewAnswers(nextNewAnswers)

    // Run trigger evaluation and collect follow-ups + safety flags
    const sessionId = `${entryDateKey}_${period}`
    const results = evaluateTriggers(nextNewAnswers, sessionId)
    const newFlags = results.map(r => r.flag)
    const allFollowUps = results.flatMap(r => r.followUpQuestionIds)

    if (newFlags.length > 0) {
      setSafetyFlags(prev => {
        const existingIds = new Set(prev.map(f => f.id))
        return [...prev, ...newFlags.filter(f => !existingIds.has(f.id))]
      })
    }

    if (allFollowUps.length > 0) {
      setPendingFollowUpIds(prev => {
        const existing = new Set(prev)
        return [...prev, ...allFollowUps.filter(id => !existing.has(id))]
      })
    }

    if (requiresSafetyPause(newFlags)) {
      setShowSafetyScreen(true)
      return
    }

    if (autoAdvance) {
      window.setTimeout(() => {
        if (stepIndex >= renderedNewQuestions.length - 1) {
          void finishCheckIn(answers)
          return
        }
        setStepIndex((current) => Math.min(current + 1, renderedNewQuestions.length - 1))
      }, 160)
    }
  }

  function applyAnswer(questionId: string, value: AnswerValue, autoAdvance = false) {
    const nextAnswers = {
      ...answers,
      [questionId]: value,
    }

    setAnswers(nextAnswers)

    if (autoAdvance) {
      window.setTimeout(() => {
        const nextQuestions = getQuestionsForPeriod(period, nextAnswers, {
          includeMorningQuestions: shouldIncludeMorningQuestions,
        })

        if (stepIndex >= nextQuestions.length - 1) {
          void finishCheckIn(nextAnswers)
          return
        }

        setStepIndex((current) => Math.min(current + 1, nextQuestions.length - 1))
      }, 160)
    }
  }

  function sameAsPrevious() {
    if (!previousAnswers) {
      return
    }

    void finishCheckIn(previousAnswers)
  }

  if (showSafetyScreen) {
    return (
      <SafetyScreen
        flags={safetyFlags}
        onContinue={() => {
          setShowSafetyScreen(false)
          if (stepIndex < renderedNewQuestions.length - 1) {
            setStepIndex(s => s + 1)
          } else {
            void finishCheckIn(answers)
          }
        }}
        onExit={() => router.push('/')}
      />
    )
  }

  if (isLoadingState) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <LogoWordmark compact />
          </header>
          <section className="rounded-[2.5rem] border border-stone-100 bg-white p-6 text-center shadow-[0_28px_100px_rgba(76,149,108,0.10)] sm:p-8">
            <h1 className="font-display text-3xl text-stone-900">Loading your check-in</h1>
            <p className="mt-3 text-sm text-stone-500">Pulling the latest saved answers from the backend.</p>
          </section>
        </div>
      </main>
    )
  }

  if (newSystemActive && !currentNewStep) {
    return null
  }

  if (!newSystemActive && !currentStep) {
    return null
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <LogoWordmark compact />
          <Link
            href="/"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5"
          >
            Back home
          </Link>
        </header>

        <section className="rounded-[2.5rem] border border-stone-100 bg-white p-6 shadow-[0_28px_100px_rgba(76,149,108,0.10)] sm:p-8">
          {loadError ? (
            <div className="mb-6 rounded-[1.2rem] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4c956c]">
                {formatLongDate(entryDateKey)}
              </p>
              <h1 className="font-display mt-3 text-3xl text-stone-900 sm:text-4xl">
                {getPeriodLabel(period)} check-in
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                One calm question at a time.
              </p>
            </div>

            {previousAnswers ? (
              <button
                type="button"
                onClick={sameAsPrevious}
                className="rounded-full border border-[#b8dcc9] bg-[#e0f5ec] px-4 py-3 text-sm font-semibold text-[#2c6e49] transition hover:-translate-y-0.5"
              >
                Same as yesterday
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-full bg-[#f0f0f0] p-1">
            <div
              className="h-2 rounded-full bg-[#4c956c] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
            <span>
              Question {stepIndex + 1} of {activeQuestions.length}
            </span>
            <span>{isSaving ? 'Saving...' : 'Relaxed pace'}</span>
          </div>

          <AnimatePresence mode="wait">
            {newSystemActive && currentNewStep ? (
              <motion.div
                key={currentNewStep.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mt-8 space-y-7"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-[#4c956c]">
                    {currentNewStep.domain.replace(/_/g, ' ')}
                  </p>
                  <h2 className="font-display mt-3 text-4xl leading-tight text-stone-900">
                    {currentNewStep.text}
                  </h2>
                  {currentNewStep.examples && currentNewStep.examples.length > 0 ? (
                    <p className="mt-3 max-w-2xl text-base leading-7 text-stone-500">
                      e.g. {currentNewStep.examples.join(', ')}
                    </p>
                  ) : null}
                </div>

                <NewChoiceGrid
                  question={currentNewStep}
                  value={newAnswers[currentNewStep.id] ?? []}
                  onSelect={(ids) =>
                    applyNewAnswer(
                      currentNewStep.id,
                      ids,
                      currentNewStep.responseType === 'single_choice',
                    )
                  }
                />
              </motion.div>
            ) : currentStep ? (
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mt-8 space-y-7"
              >
                <div>
                  <p className="text-sm font-medium text-[#4c956c]">
                    {currentStep.factors
                      .map(
                        (factor) =>
                          FACTOR_CONFIG.find((item) => item.key === factor)?.label ?? factor
                      )
                      .join(' / ')}
                  </p>
                  <h2 className="font-display mt-3 text-4xl leading-tight text-stone-900">
                    {currentStep.prompt}
                  </h2>
                  {currentStep.helper ? (
                    <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                      {currentStep.helper}
                    </p>
                  ) : null}
                </div>

                {currentStep.kind === 'single_choice' ? (
                  <ChoiceGrid
                    options={currentStep.options}
                    value={String(answers[currentStep.id] ?? currentStep.options[0])}
                    onSelect={(value) => applyAnswer(currentStep.id, value, true)}
                    columns={getChoiceColumns(currentStep.options.length)}
                  />
                ) : null}

                {currentStep.kind === 'slider' ? (
                  <SliderStep
                    question={currentStep}
                    value={Number(answers[currentStep.id] ?? currentStep.min)}
                    onChange={(value) => applyAnswer(currentStep.id, value)}
                  />
                ) : null}

                {currentStep.kind === 'multi_select' ? (
                  <MultiSelectStep
                    options={currentStep.options}
                    value={(answers[currentStep.id] as string[]) ?? []}
                    onChange={(value) => applyAnswer(currentStep.id, value)}
                  />
                ) : null}

                {currentStep.kind === 'substance_use' ? (
                  <SubstanceStep
                    question={currentStep}
                    value={
                      (answers[currentStep.id] as SubstanceUseAnswer) ?? {
                        substances: [],
                        customSubstance: '',
                        frequency: 'None',
                      }
                    }
                    onChange={(value) => applyAnswer(currentStep.id, value)}
                  />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="rounded-full border border-[#e5e5e5] bg-white px-5 py-3 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Back
            </button>

            {newSystemActive && currentNewStep ? (
              currentNewStep.responseType === 'multi_choice' || currentNewStep.responseType === 'text_optional' ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  {stepIndex >= renderedNewQuestions.length - 1 ? "Save check-in" : 'Next question'}
                </button>
              ) : (
                <p className="text-sm text-stone-500">Tap an answer to continue.</p>
              )
            ) : currentStep && (currentStep.kind === 'slider' || currentStep.kind === 'multi_select' || currentStep.kind === 'substance_use') ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)]"
              >
                {stepIndex >= questions.length - 1 ? "Save today's check-in" : 'Next question'}
              </button>
            ) : (
              <p className="text-sm text-stone-500">Single-choice answers continue automatically.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
