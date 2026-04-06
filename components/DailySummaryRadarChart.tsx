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
import { FACTOR_CONFIG, FactorKey, formatLongDate } from '@/components/checkInData'

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
  const values = FACTOR_CONFIG.map((factor) => factorScores[factor.key] ?? 50)

  const option: EChartsOption = {
    animationDuration: 500,
    title: {
      text: 'Wellbeing radar',
      subtext: formatLongDate(date),
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
      formatter() {
        return FACTOR_CONFIG.map(
          (factor, index) => `${factor.label}: ${Math.round(Number(values[index]))}/100`
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
      indicator: FACTOR_CONFIG.map((factor) => ({
        name: factor.label,
        max: 100,
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
        'rounded-[2rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_rgba(190,198,189,0.22)] backdrop-blur-xl sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2 pt-1">
        <div>
          <p className="text-sm font-medium text-stone-900">Factor score radar</p>
          <p className="text-sm text-stone-500">Each axis is scored from 0 to 100.</p>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500">
          Scale 0-100
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
