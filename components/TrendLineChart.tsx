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
import { useSmallScreen } from '@/lib/use-small-screen'

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
  const isSmallScreen = useSmallScreen()

  const option: EChartsOption = {
    animationDuration: 400,
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e7e5e4',
      textStyle: {
        color: '#1c1917',
        fontSize: isSmallScreen ? 11 : 12,
      },
    },
    grid: {
      top: 24,
      left: isSmallScreen ? 6 : 10,
      right: isSmallScreen ? 8 : 16,
      bottom: isSmallScreen ? 34 : 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: '#d7d0c2' },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#78716c',
        margin: isSmallScreen ? 10 : 12,
        fontSize: isSmallScreen ? 10 : 12,
        hideOverlap: true,
        rotate: isSmallScreen ? 24 : 0,
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
        margin: isSmallScreen ? 8 : 10,
        fontSize: isSmallScreen ? 10 : 12,
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
    <div className="relative h-[300px] w-full sm:h-[360px]">
      <div className="pointer-events-none absolute bottom-[2px] left-1/2 hidden -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:block">
        Date
      </div>

      <div className="pointer-events-none absolute left-[2px] top-1/2 hidden origin-center -translate-y-1/2 -rotate-90 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:block">
        Score
      </div>

      <div className="absolute inset-0 sm:bottom-8 sm:left-8 sm:right-0 sm:top-0">
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
