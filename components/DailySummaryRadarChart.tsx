'use client'

import dynamic from 'next/dynamic'
import type { EChartsOption } from 'echarts'
import { RadarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { use as registerEChartsModules } from 'echarts/core'
import { FACTOR_CONFIG, FactorKey, formatLongDate } from '@/components/checkInData'
import { useSmallScreen } from '@/lib/use-small-screen'

registerEChartsModules([
  RadarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
})

export default function DailySummaryRadarChart({
  date,
  factorScores,
  className,
}: {
  date: string
  factorScores: Record<FactorKey, number>
  className?: string
}) {
  const isSmallScreen = useSmallScreen()
  const values = FACTOR_CONFIG.map((factor) => factorScores[factor.key] ?? 50)
  const indicatorLabels = FACTOR_CONFIG.map((factor) => ({
    name: isSmallScreen
      ? (
          {
            pain: 'Pain',
            mental: 'Mental',
            social: 'Social',
            lifestyle: 'Lifestyle',
            diet: 'Diet',
            environment: 'Environment',
            medication: 'Medication',
            activity: 'Activity',
          } satisfies Record<FactorKey, string>
        )[factor.key]
      : factor.label,
    max: 100,
  }))

  const option: EChartsOption = {
    animationDuration: 500,
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e7e5e4',
      borderWidth: 1,
      textStyle: {
        color: '#1c1917',
        fontSize: isSmallScreen ? 11 : 12,
      },
      formatter() {
        return FACTOR_CONFIG.map(
          (factor, index) => `${factor.label}: ${Math.round(Number(values[index]))}/100`
        ).join('<br/>')
      },
    },
    radar: {
      radius: isSmallScreen ? '54%' : '66%',
      center: ['50%', isSmallScreen ? '54%' : '56%'],
      splitNumber: isSmallScreen ? 4 : 5,
      shape: 'polygon',
      axisName: {
        color: '#57534e',
        fontSize: isSmallScreen ? 10 : 12,
      },
      indicator: indicatorLabels,
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.92)', 'rgba(249,249,249,0.72)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: '#e7e5e4',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d5d5d5',
        },
      },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: isSmallScreen ? 5 : 7,
        lineStyle: {
          width: 2,
          color: '#4c956c',
        },
        itemStyle: {
          color: '#4c956c',
        },
        areaStyle: {
          color: 'rgba(76, 149, 108, 0.18)',
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
      aria-label={`Wellbeing radar chart for ${formatLongDate(date)}`}
      className={[
        'flex flex-col rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(76,149,108,0.22)] sm:p-7',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2c6e49]">Wellness snapshot</p>
        <p className="mt-3 text-xs text-stone-600">Latest snapshot for {formatLongDate(date)}.</p>
      </div>

      <div className="-mt-12 min-h-0 flex-1" style={{ minHeight: isSmallScreen ? 280 : 320 }}>
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </section>
  )
}
