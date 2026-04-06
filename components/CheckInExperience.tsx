'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import LogoWordmark from '@/components/LogoWordmark'
import {
  AnswerValue,
  CheckInPeriod,
  FACTOR_CONFIG,
  QuestionDefinition,
  SubstanceUseAnswer,
  copyPreviousAnswers,
  createEmptyAnswers,
  formatLongDate,
  getPeriodLabel,
  getQuestionsForPeriod,
  getTodayKey,
  readWellnessState,
  saveSession,
  writeWellnessState,
} from '@/components/checkInData'

function getChoiceColumns(count: number) {
  if (count <= 2) {
    return 'sm:grid-cols-2'
  }

  if (count === 3) {
    return 'sm:grid-cols-3'
  }

  return 'sm:grid-cols-2'
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
                ? 'border-[#6b8f56] bg-[#6b8f56] text-white shadow-[0_12px_24px_rgba(107,143,86,0.22)]'
                : 'border-[#e8e1d3] bg-white text-stone-700 hover:-translate-y-0.5 hover:border-[#d2c6b0]'
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
      <div className="rounded-[1.7rem] bg-[#f7f2e7] p-6">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[#6b8f56]"
          style={{
            background: `linear-gradient(90deg, #6b8f56 ${percentage}%, #ded3bf ${percentage}%)`,
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
                    ? 'border-[#6b8f56] bg-[#eef5e5] text-[#456246]'
                    : 'border-[#e6dccd] bg-white text-stone-500'
                }`}
              >
                {tickLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#ece5d9] bg-white px-5 py-4">
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
                ? 'border-[#6b8f56] bg-[#eef5e5] text-[#456246]'
                : 'border-[#e8e1d3] bg-white text-stone-700'
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6f8e58]">
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
                    ? 'border-[#6b8f56] bg-[#eef5e5] text-[#456246]'
                    : 'border-[#e8e1d3] bg-white text-stone-700'
                }`}
              >
                <span className="text-base font-semibold">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6f8e58]">
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
                    ? 'border-[#6b8f56] bg-[#eef5e5] text-[#456246]'
                    : 'border-[#e8e1d3] bg-white text-stone-700'
                }`}
              >
                <span className="text-base font-semibold">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#e8e1d3] bg-white px-5 py-4">
        <label className="block text-sm font-semibold text-stone-900">Other substance</label>
        <input
          value={value.customSubstance}
          onChange={(event) => onChange({ ...value, customSubstance: event.target.value })}
          placeholder="Type a substance if it is not listed"
          className="mt-3 w-full rounded-[1rem] border border-[#e2d8c8] bg-[#fcfaf5] px-4 py-3 text-sm text-stone-700 outline-none"
        />
      </div>
    </div>
  )
}

export default function CheckInExperience() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedPeriod = searchParams.get('period')
  const period: CheckInPeriod =
    requestedPeriod === 'night' || requestedPeriod === 'weekly' ? requestedPeriod : 'morning'
  const todayKey = getTodayKey()

  const [state, setState] = useState(() => readWellnessState())
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    () => state.sessions[`${todayKey}:${period}`]?.answers ?? createEmptyAnswers(period)
  )
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const questions = useMemo(() => getQuestionsForPeriod(period, answers), [period, answers])
  const currentStep = questions[Math.min(stepIndex, Math.max(questions.length - 1, 0))]
  const progress = questions.length ? ((stepIndex + 1) / questions.length) * 100 : 0
  const previousAnswers = period === 'weekly' ? null : copyPreviousAnswers(state.sessions, todayKey, period)

  function persistAnswers(nextAnswers: Record<string, AnswerValue>) {
    const nextState = {
      ...state,
      sessions: saveSession(state.sessions, todayKey, period, nextAnswers),
    }

    setState(nextState)
    writeWellnessState(nextState)
  }

  function finishCheckIn(nextAnswers: Record<string, AnswerValue>) {
    setIsSaving(true)
    persistAnswers(nextAnswers)
    router.push('/')
  }

  function goNext() {
    if (stepIndex >= questions.length - 1) {
      finishCheckIn(answers)
      return
    }

    setStepIndex((current) => Math.min(current + 1, questions.length - 1))
  }

  function applyAnswer(questionId: string, value: AnswerValue, autoAdvance = false) {
    const nextAnswers = {
      ...answers,
      [questionId]: value,
    }

    setAnswers(nextAnswers)

    if (autoAdvance) {
      window.setTimeout(() => {
        const nextQuestions = getQuestionsForPeriod(period, nextAnswers)

        if (stepIndex >= nextQuestions.length - 1) {
          finishCheckIn(nextAnswers)
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

    finishCheckIn(previousAnswers)
  }

  if (!currentStep) {
    return null
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <LogoWordmark compact />
          <Link
            href="/"
            className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5"
          >
            Back home
          </Link>
        </header>

        <section className="rounded-[2.5rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_100px_rgba(120,133,107,0.16)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
                {formatLongDate(todayKey)}
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
                className="rounded-full border border-[#d8e5ca] bg-[#eef5e5] px-4 py-3 text-sm font-semibold text-[#456246] transition hover:-translate-y-0.5"
              >
                Same as yesterday
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-full bg-[#efe8d9] p-1">
            <div
              className="h-2 rounded-full bg-[#6f9658] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
            <span>
              Question {stepIndex + 1} of {questions.length}
            </span>
            <span>{isSaving ? 'Saving...' : 'Relaxed pace'}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-8 space-y-7"
            >
              <div>
                <p className="text-sm font-medium text-[#6f8e58]">
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
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="rounded-full border border-[#e7decd] bg-white px-5 py-3 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Back
            </button>

            {currentStep.kind === 'slider' || currentStep.kind === 'multi_select' || currentStep.kind === 'substance_use' ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-[#6f9658] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
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
