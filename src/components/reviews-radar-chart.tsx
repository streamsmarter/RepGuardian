"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ReviewsRadarChartProps {
  title: string
  description: string
  data: { category: string; value: number; label: string }[]
  color: string
}

const formatLabel = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function ReviewsRadarChart({ title, description, data, color }: ReviewsRadarChartProps) {
  const chartConfig = {
    value: {
      label: "Count",
      color: color,
    },
  } satisfies ChartConfig

  return (
    <div className="w-full h-full flex flex-col p-4 rounded-xl border bg-card">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <ChartContainer className="aspect-square w-full max-w-[400px] h-[400px]" config={chartConfig}>
          <RadarChart
            data={data}
            margin={{
              top: 40,
              right: 80,
              bottom: 40,
              left: 80,
            }}
          >
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
            <PolarAngleAxis
              dataKey="category"
              tick={({ x, y, textAnchor, index }) => {
                const item = data[index]
                return (
                  <text
                    fill="var(--foreground)"
                    fontSize={11}
                    fontWeight={500}
                    textAnchor={textAnchor}
                    x={x}
                    y={index === 0 ? Number(y) - 10 : Number(y)}
                  >
                    <tspan fill="var(--foreground)">{item.value}</tspan>
                    <tspan dy={"1rem"} fill="var(--muted-foreground)" fontSize={10} x={x}>
                      {item.label}
                    </tspan>
                  </text>
                )
              }}
            />
            <PolarGrid />
            <Radar dataKey="value" fill={color} fillOpacity={0.6} stroke={color} />
          </RadarChart>
        </ChartContainer>
      </div>
    </div>
  )
}

interface ReviewsAnalysis {
  strengths: Record<string, number>
  weaknesses: Record<string, number>
}

interface ReviewsChartsProps {
  reviewsAnalysis: ReviewsAnalysis | null
}

export function ReviewsCharts({ reviewsAnalysis }: ReviewsChartsProps) {
  if (!reviewsAnalysis) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No reviews analysis data available
      </div>
    )
  }

  const getTop6 = (data: Record<string, number>) => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([key, value]) => ({
        category: key,
        value,
        label: formatLabel(key),
      }))
  }

  const strengthsData = getTop6(reviewsAnalysis.strengths || {})
  const weaknessesData = getTop6(reviewsAnalysis.weaknesses || {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReviewsRadarChart
        title="Top Strengths"
        description="Areas where your company excels"
        data={strengthsData}
        color="#10b981"
      />
      <ReviewsRadarChart
        title="Top Weaknesses"
        description="Areas that need improvement"
        data={weaknessesData}
        color="#f43f5e"
      />
    </div>
  )
}

export default ReviewsCharts
