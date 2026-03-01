"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis } from "recharts"
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
  reviews: {
    label: "Reviews",
    color: "#3b82f6",
  },
} satisfies ChartConfig

interface ReviewsTrendChartProps {
  companyId: string;
}

export function ReviewsTrendChart({ companyId }: ReviewsTrendChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")
  const supabase = createBrowserComponentClient();

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ["dashboard-review-chart", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("review") as any)
        .select("created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredData = React.useMemo(() => {
    if (!reviewData || reviewData.length === 0) return [];

    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const filtered = reviewData.filter((item: { created_at: string }) => new Date(item.created_at) >= startDate);

    const groupedByDate: Record<string, number> = {};
    filtered.forEach((item: { created_at: string }) => {
      const dateKey = new Date(item.created_at).toISOString().split("T")[0];
      groupedByDate[dateKey] = (groupedByDate[dateKey] || 0) + 1;
    });

    return Object.entries(groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, reviews]) => ({
        date,
        reviews,
      }));
  }, [reviewData, timeRange]);

  if (isLoading) {
    return (
      <Card className="pt-0 h-full">
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
          <CardTitle>Reviews Trend</CardTitle>
          <CardDescription>
            Showing review activity based on created dates
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a time range"
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
          <LineChart data={filteredData}>
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
            <Line
              dataKey="reviews"
              type="natural"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
