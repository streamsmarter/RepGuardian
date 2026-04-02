/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ReviewsTrendCardProps {
  companyId: string;
}

type ReviewRow = {
  review_published_at: string | null;
};

type TimeRange = 'all' | '90d' | '60d' | '30d';

const timeRangeLabels: Record<TimeRange, string> = {
  all: 'All Time',
  '90d': '90 Days',
  '60d': '60 Days',
  '30d': '30 Days',
};

// Helper functions for date handling
function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysLocal(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Group daily counts into periods (e.g., 3-day averages)
function groupByPeriod(entries: [string, number][], periodSize: number): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  for (let i = 0; i < entries.length; i += periodSize) {
    const slice = entries.slice(i, i + periodSize);
    const sum = slice.reduce((a, b) => a + b[1], 0);
    // Use the middle date of the period for display
    const midIndex = Math.floor(slice.length / 2);
    result.push({ date: slice[midIndex][0], count: sum });
  }
  return result;
}

// Generate 4 evenly spaced labels from the date range
function generateLabels(entries: [string, number][]) {
  if (entries.length === 0) return ['', '', '', ''];
  const step = Math.max(1, Math.floor(entries.length / 4));
  const indices = [0, step, step * 2, entries.length - 1];
  return indices.map((i) => {
    const dateStr = entries[Math.min(i, entries.length - 1)][0];
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}

export function ReviewsTrendCard({ companyId }: ReviewsTrendCardProps) {
  const supabase = createBrowserComponentClient();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [hoverData, setHoverData] = useState<{ x: number; y: number; date: string; count: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['command-center-reviews', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('review') as any)
        .select('review_published_at')
        .eq('company_id', companyId)
        .not('review_published_at', 'is', null)
        .order('review_published_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
    staleTime: 30_000,
  });

  // Process data for chart - group by 3-day periods for smoother visualization
  const chartData = useMemo(() => {
    const now = new Date();
    const end = startOfDayLocal(now);
    let start: Date;

    if (timeRange === 'all') {
      // Find earliest review date
      let earliestTimestamp: number | null = null;
      for (const row of reviewData ?? []) {
        if (!row.review_published_at) continue;
        const dt = new Date(row.review_published_at);
        if (Number.isNaN(dt.getTime())) continue;
        const dayTimestamp = startOfDayLocal(dt).getTime();
        earliestTimestamp = earliestTimestamp === null ? dayTimestamp : Math.min(earliestTimestamp, dayTimestamp);
      }
      start = earliestTimestamp !== null ? new Date(earliestTimestamp) : startOfDayLocal(addDaysLocal(end, -89));
    } else {
      const daysToSubtract = timeRange === '30d' ? 30 : timeRange === '60d' ? 60 : 90;
      start = startOfDayLocal(addDaysLocal(end, -(daysToSubtract - 1)));
    }

    const rangeEndExclusive = addDaysLocal(end, 1);

    // Build full day range with zeros
    const dailyCounts: Record<string, number> = {};
    for (let d = new Date(start); d <= end; d = addDaysLocal(d, 1)) {
      dailyCounts[dayKeyLocal(d)] = 0;
    }

    if (!reviewData || reviewData.length === 0) {
      const entries = Object.entries(dailyCounts) as [string, number][];
      const grouped = groupByPeriod(entries, 3);
      return { periodData: grouped, maxCount: 0, labels: generateLabels(entries) };
    }

    // Count reviews per day
    for (const row of reviewData) {
      if (!row.review_published_at) continue;
      const dt = new Date(row.review_published_at);
      if (Number.isNaN(dt.getTime())) continue;
      if (dt < start || dt >= rangeEndExclusive) continue;
      const key = dayKeyLocal(dt);
      if (key in dailyCounts) dailyCounts[key] += 1;
    }

    const entries = Object.entries(dailyCounts) as [string, number][];
    
    // Group into 3-day periods for smoother chart
    const periodData = groupByPeriod(entries, 3);
    const maxCount = Math.max(...periodData.map(p => p.count), 1);

    return { periodData, maxCount, labels: generateLabels(entries) };
  }, [reviewData, timeRange]);

  // Current month review count
  const currentMonthCount = useMemo(() => {
    if (!reviewData) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return reviewData.filter((row) => {
      if (!row.review_published_at) return false;
      return new Date(row.review_published_at) >= monthStart;
    }).length;
  }, [reviewData]);

  return (
    <div className="col-span-12 lg:col-span-7 bg-[#1a1919] rounded-2xl p-8 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold">Reviews Trend</h3>
          <p className="text-muted-foreground text-xs">
            Performance trajectory over {timeRange === 'all' ? 'all time' : `the last ${timeRangeLabels[timeRange].toLowerCase()}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span>{currentMonthCount} this month</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-[#201f1f] rounded text-muted-foreground hover:!bg-[#201f1f] hover:text-primary transition-all text-xs font-medium gap-1 cursor-pointer"
              >
                {timeRangeLabels[timeRange]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1919] border-white/10">
              <DropdownMenuItem onClick={() => setTimeRange('all')} className="text-xs cursor-pointer">
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('90d')} className="text-xs cursor-pointer">
                90 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('60d')} className="text-xs cursor-pointer">
                60 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('30d')} className="text-xs cursor-pointer">
                30 Days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="h-48 relative" ref={chartRef}>
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-lg" />
        ) : (
          <>
            {/* SVG Line Chart */}
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Grid Lines */}
              <line className="stroke-[#484847]/10" x1="0" x2="100" y1="25" y2="25" />
              <line className="stroke-[#484847]/10" x1="0" x2="100" y1="50" y2="50" />
              <line className="stroke-[#484847]/10" x1="0" x2="100" y1="75" y2="75" />
              
              {chartData.periodData.length > 0 && chartData.maxCount > 0 && (() => {
                const points = chartData.periodData.map((item, i) => {
                  const x = (i / Math.max(chartData.periodData.length - 1, 1)) * 100;
                  const y = 100 - (item.count / chartData.maxCount) * 80;
                  return { x, y, date: item.date, count: item.count };
                });
                
                // Create smooth curve using cubic bezier
                const smoothPath = (pts: {x: number, y: number}[]) => {
                  if (pts.length < 2) return '';
                  let path = `M${pts[0].x} ${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[Math.max(i - 1, 0)];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[Math.min(i + 2, pts.length - 1)];
                    const cp1x = p1.x + (p2.x - p0.x) / 6;
                    const cp1y = p1.y + (p2.y - p0.y) / 6;
                    const cp2x = p2.x - (p3.x - p1.x) / 6;
                    const cp2y = p2.y - (p3.y - p1.y) / 6;
                    path += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                  }
                  return path;
                };
                
                const linePath = smoothPath(points);
                const areaPath = `${linePath} L100 100 L0 100 Z`;
                
                return (
                  <>
                    {/* Area Fill */}
                    <path 
                      className="fill-primary/10" 
                      d={areaPath}
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Line */}
                    <path 
                      className="stroke-primary fill-none" 
                      strokeWidth="1.5"
                      d={linePath}
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Invisible hover areas for each point */}
                    {points.map((point, idx) => (
                      <circle
                        key={idx}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        className="fill-transparent cursor-pointer"
                        onMouseEnter={() => {
                          const rect = chartRef.current?.getBoundingClientRect();
                          if (rect) {
                            const xPos = (point.x / 100) * rect.width;
                            const yPos = (point.y / 100) * rect.height;
                            setHoverData({ x: xPos, y: yPos, date: point.date, count: point.count });
                          }
                        }}
                        onMouseLeave={() => setHoverData(null)}
                      />
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* Chart Labels */}
            <div className="absolute bottom-0 w-full flex justify-between px-2 text-[9px] text-muted-foreground/40 uppercase tracking-widest">
              {chartData.labels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>

            {/* Hover Tooltip */}
            {hoverData && (
              <div 
                className="absolute pointer-events-none bg-[#262626] border border-[#484847]/30 rounded-lg px-3 py-2 shadow-lg z-10"
                style={{
                  left: hoverData.x,
                  top: Math.max(hoverData.y - 50, 0),
                }}
              >
                <p className="text-xs font-medium text-white">
                  {new Date(hoverData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm font-bold text-primary">
                  {hoverData.count} {hoverData.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
