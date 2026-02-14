"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { createBrowserComponentClient } from "@/lib/supabase/client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  count: {
    label: "Count",
  },
  positive: {
    label: "Positive",
    color: "#10b981",
  },
  negative: {
    label: "Negative",
    color: "#f43f5e",
  },
} satisfies ChartConfig

interface FeedbackDonutChartProps {
  companyId: string;
}

export function FeedbackDonutChart({ companyId }: FeedbackDonutChartProps) {
  const supabase = createBrowserComponentClient();

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ["feedback-donut", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("sentiment_score")
        .eq("company_id", companyId);

      if (error) throw error;
      return data || [];
    },
  });

  const chartData = React.useMemo(() => {
    if (!feedbackData || feedbackData.length === 0) return [];

    const positive = feedbackData.filter((f: any) => f.sentiment_score >= 4).length;
    const negative = feedbackData.filter((f: any) => f.sentiment_score <= 3).length;

    return [
      { sentiment: "positive", count: positive, fill: "#10b981" },
      { sentiment: "negative", count: negative, fill: "#f43f5e" },
    ];
  }, [feedbackData]);

  const totalFeedback = React.useMemo(() => {
    return feedbackData?.length || 0;
  }, [feedbackData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-center pb-2">
        <h3 className="text-sm font-semibold">Feedback Distribution</h3>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full h-full max-w-[250px] max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="sentiment"
              innerRadius={50}
              outerRadius={90}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalFeedback.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="flex items-center justify-center gap-4 text-sm pt-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Negative</span>
        </div>
      </div>
    </div>
  )
}

export default FeedbackDonutChart
