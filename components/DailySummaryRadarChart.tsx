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
  height = 420,
}: {
  date: string
  factorScores: Record<FactorKey, number>
  className?: string
  height?: number
}) {
  const isSmallScreen = useSmallScreen()
  const values = FACTOR_CONFIG.map((factor) => factorScores[factor.key] ?? 50)
  const chartHeight = isSmallScreen ? Math.min(height, 320) : height
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
        symbolSize: isSmallScreen ? 5 : 7,
        lineStyle: {
          width: 2,
          color: '#6f9658',
        },
        itemStyle: {
          color: '#6f9658',
        },
        areaStyle: {
          color: 'rgba(111, 150, 88, 0.18)',
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
        'rounded-[2rem] border border-stone-200 bg-white p-4 shadow-[0_24px_80px_rgba(190,198,189,0.22)] sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-3 px-2 pb-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-900">Factor score radar</p>
          <p className="text-sm text-stone-500">Latest snapshot for {formatLongDate(date)}.</p>
        </div>
        <div className="w-fit rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500">
          Scale 0-100
        </div>
      </div>

      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </section>
  )
}
