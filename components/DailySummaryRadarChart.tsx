'use client'

import dynamic from 'next/dynamic'
import type { EChartsOption } from 'echarts'
import { RadarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { use as registerEChartsModules } from 'echarts/core'

registerEChartsModules([
  RadarChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
})

export type DailySummary = {
  date: string
  scores?: Partial<{
    mood: number
    energy: number
    sleep: number
    stress: number
    pain: number
    appetite: number
    activity: number
    social: number
  }>
}

type ScoreKey =
  | 'mood'
  | 'energy'
  | 'sleep'
  | 'stress'
  | 'pain'
  | 'appetite'
  | 'activity'
  | 'social'

const DIMENSIONS: Array<{ key: ScoreKey; label: string }> = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'stress', label: 'Stress' },
  { key: 'pain', label: 'Pain' },
  { key: 'appetite', label: 'Appetite' },
  { key: 'activity', label: 'Activity' },
  { key: 'social', label: 'Social' },
]

function clampScore(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.min(10, Math.max(0, value))
}

function getTooltipValues(params: unknown) {
  if (
    typeof params === 'object' &&
    params !== null &&
    'value' in params &&
    Array.isArray((params as { value?: unknown }).value)
  ) {
    return (params as { value: unknown[] }).value
  }

  return null
}

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DailySummaryRadarChart({
  summary,
  className,
  height = 420,
}: {
  summary: DailySummary
  className?: string
  height?: number
}) {
  const values = DIMENSIONS.map(({ key }) => clampScore(summary.scores?.[key]))

  const option: EChartsOption = {
    animation: false,
    title: {
      text: "How you've been feeling today",
      subtext: formatDateLabel(summary.date),
      left: 'center',
      top: 12,
      textStyle: {
        color: '#1c1917',
        fontSize: 20,
        fontWeight: 600,
      },
      subtextStyle: {
        color: '#78716c',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e7e5e4',
      borderWidth: 1,
      textStyle: {
        color: '#1c1917',
      },
      formatter(params) {
        const pointValues = getTooltipValues(params) ?? values

        return DIMENSIONS.map(
          ({ label }, index) => `${label}: ${clampScore(Number(pointValues[index]))}/10`
        ).join('<br/>')
      },
    },
    radar: {
      radius: '60%',
      center: ['50%', '58%'],
      splitNumber: 5,
      shape: 'polygon',
      axisName: {
        color: '#57534e',
        fontSize: 12,
      },
      indicator: DIMENSIONS.map(({ label }) => ({
        name: label,
        max: 10,
      })),
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.92)', 'rgba(248,245,240,0.72)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: '#e7e5e4',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d6d3d1',
        },
      },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          width: 2,
          color: '#5f7f75',
        },
        itemStyle: {
          color: '#5f7f75',
        },
        areaStyle: {
          color: 'rgba(95, 127, 117, 0.18)',
        },
        data: [
          {
            value: values,
            name: 'Today',
          },
        ],
      },
    ],
  }

  return (
    <section
      aria-label={`Daily feelings radar chart for ${formatDateLabel(summary.date)}`}
      className={[
        'rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(190,198,189,0.28)] backdrop-blur-xl sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2 pt-1">
        <div>
          <p className="text-sm font-medium text-stone-900">Patient feelings radar</p>
          <p className="text-sm text-stone-500">Scores are normalized on a 0-10 scale.</p>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500">
          Scale 0-10
        </div>
      </div>

      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </section>
  )
}
