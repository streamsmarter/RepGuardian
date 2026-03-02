"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
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
  const [timeRange, setTimeRange] = React.useState<"90d" | "30d" | "7d">("90d");
  const supabase = createBrowserComponentClient();

  const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

  const { data: reviewData, isLoading, isError } = useQuery({
    queryKey: ["dashboard-review-chart", companyId, timeRange],
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
    const start = startOfDayLocal(addDaysLocal(end, -(daysToSubtract - 1))); // inclusive

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
      if (dt < start || dt > addDaysLocal(end, 1)) continue;

      const key = dayKeyLocal(dt);
      if (key in counts) counts[key] += 1;
    }

    return Object.entries(counts).map(([date, reviews]) => ({ date, reviews }));
  }, [reviewData, daysToSubtract]);

  const max = React.useMemo(() => {
    if (!series || series.length === 0) return 0;
    return Math.max(...series.map((d) => d.reviews ?? 0));
  }, [series]);

  if (isLoading) {
    return (
      <Card className="h-full gap-0 py-0">
        <CardHeader className="flex flex-col gap-3 border-b pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent className="pb-6 pt-4">
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-1">
          <CardTitle>Reviews Trend</CardTitle>
          <CardDescription>Showing review activity based on published dates</CardDescription>
        </div>

        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select a time range">
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

      <CardContent className="pb-6 pt-4">
        <div className="h-[260px] w-full">

          {isError ? (
            <div className="h-full w-full rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
              Couldn’t load review trend.
            </div>
          ) : max === 0 ? (
            <div className="h-full w-full rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
              No reviews in this time range.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={series}>
                <CartesianGrid vertical={false} />
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
                <Line dataKey="reviews" type="monotone" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}