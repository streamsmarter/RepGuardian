"use client";

import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { useQuery } from "@tanstack/react-query";
import { createBrowserComponentClient } from "@/lib/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  reviews: {
    label: "Reviews",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

interface ReviewsTrendChartProps {
  companyId: string;
}

type TimeRange = "all" | "90d" | "30d" | "7d";

type ReviewRow = {
  review_published_at: string | null;
};

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysLocal(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dayKeyLocal(d: Date) {
  // stable local YYYY-MM-DD (avoids UTC shifting)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReviewsTrendChart({ companyId }: ReviewsTrendChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("90d");
  const supabase = createBrowserComponentClient();

  const { data: reviewData, isLoading, isError } = useQuery({
    queryKey: ["dashboard-review-chart", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("review") as any)
        .select("review_published_at")
        .eq("company_id", companyId)
        .not("review_published_at", "is", null)
        .order("review_published_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
    staleTime: 30_000,
  });

  const series = React.useMemo(() => {
    const now = new Date();
    const end = startOfDayLocal(now);
    let start = startOfDayLocal(addDaysLocal(end, -89)); // default: last 90 days

    if (timeRange === "all") {
      let earliestTimestamp: number | null = null;

      for (const row of reviewData ?? []) {
        if (!row.review_published_at) continue;
        const dt = new Date(row.review_published_at);
        if (Number.isNaN(dt.getTime())) continue;

        const dayTimestamp = startOfDayLocal(dt).getTime();
        earliestTimestamp = earliestTimestamp === null ? dayTimestamp : Math.min(earliestTimestamp, dayTimestamp);
      }

      if (earliestTimestamp !== null) {
        start = new Date(earliestTimestamp);
      }
    } else {
      const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      start = startOfDayLocal(addDaysLocal(end, -(daysToSubtract - 1))); // inclusive
    }

    const rangeEndExclusive = addDaysLocal(end, 1);

    // build full day range with zeros so chart always looks normal
    const counts: Record<string, number> = {};
    for (let d = new Date(start); d <= end; d = addDaysLocal(d, 1)) {
      counts[dayKeyLocal(d)] = 0;
    }

    if (!reviewData || reviewData.length === 0) {
      return Object.entries(counts).map(([date, reviews]) => ({ date, reviews }));
    }

    for (const row of reviewData) {
      if (!row.review_published_at) continue;
      const dt = new Date(row.review_published_at);
      if (Number.isNaN(dt.getTime())) continue;

      // keep within range
      if (dt < start || dt >= rangeEndExclusive) continue;

      const key = dayKeyLocal(dt);
      if (key in counts) counts[key] += 1;
    }

    return Object.entries(counts).map(([date, reviews]) => ({ date, reviews }));
  }, [reviewData, timeRange]);

  const max = React.useMemo(() => {
    if (!series || series.length === 0) return 0;
    return Math.max(...series.map((d) => d.reviews ?? 0));
  }, [series]);

  const yAxisMax = React.useMemo(() => {
    return Math.ceil(max * 1.2);
  }, [max]);

  const yTicks = React.useMemo(() => {
    if (max <= 0) return [0];
    const segments = 6;
    const step = yAxisMax / segments;
    return Array.from({ length: segments + 1 }, (_, i) => Number((i * step).toFixed(2)));
  }, [max, yAxisMax]);

  const currentMonthReviewCount = React.useMemo(() => {
    if (!reviewData || reviewData.length === 0) return 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return reviewData.reduce((count, row) => {
      if (!row.review_published_at) return count;
      const dt = new Date(row.review_published_at);
      if (Number.isNaN(dt.getTime())) return count;
      return dt >= monthStart && dt < nextMonthStart ? count + 1 : count;
    }, 0);
  }, [reviewData]);

  if (isLoading) {
    return (
      <Card className="h-full min-h-[480px] gap-0 py-0">
        <CardHeader className="flex flex-col gap-3 border-b pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent className="pb-6 pt-4">
          <Skeleton className="h-[340px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[480px] gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-1">
          <CardTitle>Reviews Trend</CardTitle>
          <CardDescription>Showing review activity based on published dates</CardDescription>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>{currentMonthReviewCount} this month</span>
          </div>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="hidden w-[160px] rounded-lg sm:flex" aria-label="Select a time range">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All time
              </SelectItem>
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
        </div>
      </CardHeader>

      <CardContent className="pb-6 pt-5">
        <div className="h-[340px] w-full overflow-visible pt-2">

          {isError ? (
            <div className="h-full w-full rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
              Couldn’t load review trend.
            </div>
          ) : max === 0 ? (
            <div className="h-full w-full rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
              No reviews in this time range.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full overflow-visible">
              <ComposedChart data={series} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="reviews-trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.14} />
                    <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis
                  hide
                  ticks={yTicks}
                  domain={[0, yAxisMax]}
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }
                      indicator="dot"
                      className="min-w-[140px] gap-2"
                    />
                  }
                />
                <Area
                  dataKey="reviews"
                  type="monotone"
                  stroke="none"
                  fill="url(#reviews-trend-fill)"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="reviews"
                  type="monotone"
                  stroke="#3b82f6"
                  strokeWidth={2.35}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}