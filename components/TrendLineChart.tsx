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
      left: 16,
      right: 20,
      bottom: 20,
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
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 360, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  )
}
