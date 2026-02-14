"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { createBrowserComponentClient } from "@/lib/supabase/client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  feedback: {
    label: "Feedback Score",
    color: "#10b981",
  },
} satisfies ChartConfig

interface FeedbackChartProps {
  companyId: string;
}

export function FeedbackChart({ companyId }: FeedbackChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")
  const supabase = createBrowserComponentClient();

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ["feedback-chart", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("sentiment_score, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredData = React.useMemo(() => {
    if (!feedbackData || feedbackData.length === 0) return [];

    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Filter and aggregate by date
    const filtered = feedbackData.filter((item: any) => new Date(item.created_at) >= startDate);
    
    // Group by date and calculate average score
    const groupedByDate: Record<string, { total: number; count: number }> = {};
    filtered.forEach((item: any) => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { total: 0, count: 0 };
      }
      groupedByDate[dateKey].total += item.sentiment_score;
      groupedByDate[dateKey].count += 1;
    });

    // Convert to array sorted by date
    return Object.entries(groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, { total, count }]) => ({
        date: dateKey,
        feedback: Math.round((total / count) * 10) / 10,
      }));
  }, [feedbackData, timeRange]);

  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 h-full flex flex-col">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Feedback Trends</CardTitle>
          <CardDescription>
            Showing sentiment scores for the selected time period
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillFeedback" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#10b981"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#10b981"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                  className="min-w-[140px] gap-2"
                />
              }
            />
            <Area
              dataKey="feedback"
              type="natural"
              fill="url(#fillFeedback)"
              stroke="#10b981"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default FeedbackChart
