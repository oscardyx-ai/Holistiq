'use client'

import dynamic from 'next/dynamic'
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { use as registerEChartsModules } from 'echarts/core'
import { FACTOR_CONFIG, FactorKey, TrendPoint } from '@/components/checkInData'

registerEChartsModules([
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
})

export default function TrendLineChart({
  points,
  activeSeries,
}: {
  points: TrendPoint[]
  activeSeries: Array<FactorKey | 'total'>
}) {
  const option: EChartsOption = {
    animationDuration: 400,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e7e5e4',
      textStyle: {
        color: '#1c1917',
      },
    },
    grid: {
      top: 28,
      left: 10,
      right: 16,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      axisLine: {
        lineStyle: { color: '#d7d0c2' },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#78716c',
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: { color: '#ece5d8' },
      },
      axisLabel: {
        color: '#78716c',
        margin: 10,
      },
    },
    series: [
      ...FACTOR_CONFIG.filter((factor) => activeSeries.includes(factor.key)).map((factor) => ({
        name: factor.label,
        type: 'line' as const,
        smooth: true,
        showSymbol: false,
        data: points.map((point) => point.factorScores[factor.key]),
        lineStyle: {
          width: 2,
          color: factor.color,
        },
        itemStyle: {
          color: factor.color,
        },
      })),
      ...(activeSeries.includes('total')
        ? [
            {
              name: 'Total',
              type: 'line' as const,
              smooth: true,
              showSymbol: false,
              data: points.map((point) => point.totalScore),
              lineStyle: {
                width: 3,
                color: '#1f3c25',
              },
              itemStyle: {
                color: '#1f3c25',
              },
            },
          ]
        : []),
    ],
  }

  return (
    <div className="relative h-[360px] w-full">
      <div className="pointer-events-none absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Date
      </div>

      <div className="pointer-events-none absolute left-[2px] top-1/2 origin-center -translate-y-1/2 -rotate-90 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Score
      </div>

      <div className="absolute bottom-8 left-8 right-0 top-0">
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  )
}
