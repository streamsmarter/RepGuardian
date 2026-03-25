'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Download, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type ChartTimeRange = 'all' | '90d' | '60d' | '30d';

const chartTimeRangeLabels: Record<ChartTimeRange, string> = {
  all: 'All Time',
  '90d': '90 Days',
  '60d': '60 Days',
  '30d': '30 Days',
};

interface ReviewsAnalysis {
  strengths: Record<string, number>;
  weaknesses: Record<string, number>;
}

interface FeedbackPageClientProps {
  companyId: string;
  initialSentiment: string;
  initialSearch: string;
  reviewsAnalysis: ReviewsAnalysis | null;
}

interface Feedback {
  id: string;
  created_at: string;
  feedback_message: string;
  sentiment_score: number | null;
  tags: string[] | null;
  client_id: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
    review_submitted?: boolean;
    review_request_sent?: boolean;
  };
  conflict_status: string;
}

export function FeedbackPageClient({
  companyId,
  initialSentiment,
  initialSearch,
}: FeedbackPageClientProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [keywordFilter, setKeywordFilter] = useState(initialSearch);
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortColumn, setSortColumn] = useState<'date' | 'client' | 'sentiment'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>('30d');
  const supabase = createBrowserComponentClient();

  // Fetch feedback data
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['feedback', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          client:client(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const feedbackWithConflicts = await Promise.all(
        (data || []).map(async (feedback: any) => {
          const { data: conflicts } = await supabase
            .from('conflict')
            .select('status')
            .eq('client_id', feedback.client_id)
            .eq('company_id', companyId);

          const hasActiveConflict = conflicts?.some(
            (conflict: any) => conflict.status === 'active'
          );
          const hasResolvedConflict = conflicts?.some(
            (conflict: any) => conflict.status === 'closed'
          );

          return {
            ...feedback,
            conflict_status: hasActiveConflict
              ? 'active'
              : hasResolvedConflict
              ? 'resolved'
              : 'none',
          } as Feedback;
        })
      );

      return feedbackWithConflicts;
    },
    staleTime: 1000 * 60,
  });

  // Calculate sentiment distribution (1-3 = negative, 4 = neutral, 5 = positive)
  const sentimentStats = {
    positive: feedbackData?.filter((f) => f.sentiment_score === 5).length || 0,
    neutral: feedbackData?.filter((f) => f.sentiment_score === 4).length || 0,
    negative: feedbackData?.filter((f) => f.sentiment_score !== null && f.sentiment_score >= 1 && f.sentiment_score <= 3).length || 0,
  };

  const total = sentimentStats.positive + sentimentStats.neutral + sentimentStats.negative;
  const healthyPercent = total > 0 ? Math.round(((sentimentStats.positive + sentimentStats.neutral) / total) * 100) : 0;
  const positivePercent = total > 0 ? Math.round((sentimentStats.positive / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((sentimentStats.neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((sentimentStats.negative / total) * 100) : 0;

  // Process feedback data for trend chart - individual feedback scores over time
  // Y-axis = sentiment_score (1-5), X-axis = created_at
  const trendChartData = useMemo(() => {
    if (!feedbackData || feedbackData.length === 0) return { points: [], labels: [], minDate: '', maxDate: '' };

    // Filter feedback with valid scores and sort by date ascending
    let validFeedback = feedbackData
      .filter((item) => item.sentiment_score !== null && item.sentiment_score >= 1 && item.sentiment_score <= 5)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Apply chart time range filter
    if (chartTimeRange !== 'all') {
      const now = new Date();
      const daysAgo = chartTimeRange === '30d' ? 30 : chartTimeRange === '60d' ? 60 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      validFeedback = validFeedback.filter((f) => new Date(f.created_at) >= cutoff);
    }

    if (validFeedback.length === 0) return { points: [], labels: [], minDate: '', maxDate: '' };

    // Get date range
    const dates = validFeedback.map((f) => new Date(f.created_at).getTime());
    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);
    const timeRange = maxTime - minTime || 1; // Avoid division by zero

    // SVG dimensions
    const width = 400;
    const minY = 10; // Top (score 5)
    const maxY = 90; // Bottom (score 1)
    const scoreRange = 4; // 5 - 1 = 4

    // Generate points for each feedback entry
    const points = validFeedback.map((feedback) => {
      const feedbackTime = new Date(feedback.created_at).getTime();
      const x = ((feedbackTime - minTime) / timeRange) * width;
      // Invert Y: score 5 at top (minY), score 1 at bottom (maxY)
      const normalizedScore = (feedback.sentiment_score! - 1) / scoreRange;
      const y = maxY - normalizedScore * (maxY - minY);
      return { x, y, score: feedback.sentiment_score };
    });

    // Generate date labels (first and last dates, plus middle points)
    const formatLabel = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    };

    const labels: string[] = [];
    if (validFeedback.length >= 1) {
      labels.push(formatLabel(minTime));
      if (validFeedback.length >= 3) {
        const midTime = minTime + timeRange / 2;
        labels.push(formatLabel(midTime));
      }
      if (validFeedback.length >= 2 && minTime !== maxTime) {
        labels.push(formatLabel(maxTime));
      }
    }

    return { points, labels };
  }, [feedbackData, chartTimeRange]);

  // Filter and sort feedback based on filters
  const filteredFeedback = useMemo(() => {
    let result = feedbackData?.filter((feedback) => {
      // Keyword filter
      if (keywordFilter && !feedback.feedback_message?.toLowerCase().includes(keywordFilter.toLowerCase())) {
        return false;
      }
      // Date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        const feedbackDate = new Date(feedback.created_at);
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        if (feedbackDate < cutoff) return false;
      }
      // Sentiment filter
      if (sentimentFilter !== 'all') {
        const score = feedback.sentiment_score;
        if (sentimentFilter === 'positive' && score !== 5) return false;
        if (sentimentFilter === 'neutral' && score !== 4) return false;
        if (sentimentFilter === 'negative' && (score === null || score < 1 || score > 3)) return false;
      }
      return true;
    }) || [];

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortColumn === 'client') {
        const nameA = `${a.client?.first_name || ''} ${a.client?.last_name || ''}`.toLowerCase();
        const nameB = `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortColumn === 'sentiment') {
        comparison = (a.sentiment_score || 0) - (b.sentiment_score || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [feedbackData, keywordFilter, dateRange, sentimentFilter, sortColumn, sortDirection]);

  const handleSort = useCallback((column: 'date' | 'client' | 'sentiment') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }, [sortColumn]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getSentimentLabel = (score: number | null) => {
    if (score === null) return { label: 'UNKNOWN', color: 'bg-[#777575]/10 text-[#777575]' };
    if (score === 5) return { label: 'POSITIVE', color: 'bg-primary/10 text-primary' };
    if (score === 4) return { label: 'NEUTRAL', color: 'bg-[#8596ff]/10 text-[#8596ff]' };
    // 1-3 is negative
    return { label: 'NEGATIVE', color: 'bg-[#ff716c]/10 text-[#ff716c]' };
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '??';
  };

  const getAvatarColor = (index: number) => {
    const colors = ['bg-[#293ca0]', 'bg-[#91feef]', 'bg-[#06b77f]'];
    return colors[index % colors.length];
  };

  const getAvatarTextColor = (index: number) => {
    const colors = ['text-[#c7cdff]', 'text-[#006259]', 'text-[#002919]'];
    return colors[index % colors.length];
  };

  return (
    <section className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Feedback Analysis</h1>
          <p className="text-[#adaaaa] text-sm mt-1">
            Real-time aggregate of customer sentiment and feedback patterns.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-[#201f1f] text-[#777575] text-xs font-semibold rounded-lg flex items-center gap-2 cursor-not-allowed opacity-50"
            disabled
            title="Coming soon"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Bento Grid Visualizations */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sentiment Trends Chart */}
        <div className="col-span-8 bg-[#1a1919] rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest mb-1">
                Sentiment Trends
              </p>
              <h3 className="text-xl font-bold text-white">Growth trajectory</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 bg-[#201f1f] rounded text-muted-foreground hover:text-primary transition-all text-xs font-medium gap-1"
                >
                  {chartTimeRangeLabels[chartTimeRange]}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1919] border-white/10">
                <DropdownMenuItem onClick={() => setChartTimeRange('all')} className="text-xs cursor-pointer">
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartTimeRange('90d')} className="text-xs cursor-pointer">
                  90 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartTimeRange('60d')} className="text-xs cursor-pointer">
                  60 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartTimeRange('30d')} className="text-xs cursor-pointer">
                  30 Days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Area Chart */}
          <div className="h-48 w-full relative">
            {feedbackLoading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : trendChartData.points.length > 0 ? (
              <>
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#69f6b8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#69f6b8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d={`M${trendChartData.points[0]?.x || 0},${trendChartData.points[0]?.y || 80} ${trendChartData.points.map((p, i) => i === 0 ? '' : `L${p.x},${p.y}`).join(' ')} L400,100 L0,100 Z`}
                    fill="url(#areaGradient)"
                  />
                  {/* Line */}
                  <path
                    className="drop-shadow-[0_0_8px_rgba(105,246,184,0.3)]"
                    d={`M${trendChartData.points.map((p) => `${p.x},${p.y}`).join(' L')}`}
                    fill="none"
                    stroke="#69f6b8"
                    strokeWidth="2.5"
                  />
                  {/* Data points */}
                  {trendChartData.points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="#69f6b8"
                      className="drop-shadow-[0_0_4px_rgba(105,246,184,0.5)]"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-end justify-between px-2 pt-4">
                  {trendChartData.labels.map((label, index) => (
                    <span key={index} className="text-[10px] text-[#adaaaa]">{label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#adaaaa] text-sm">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Feedback Distribution (Doughnut) */}
        <div className="col-span-4 bg-[#1a1919] rounded-2xl p-6 flex flex-col items-center justify-between">
          <div className="w-full">
            <p className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest mb-1">
              Feedback Distribution
            </p>
            <h3 className="text-xl font-bold text-white">Sentiment Split</h3>
          </div>
          <div className="relative w-32 h-32 my-4">
            {feedbackLoading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : (
              <>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <circle cx="18" cy="18" fill="none" r="16" stroke="#201f1f" strokeWidth="3" />
                  {/* Neutral Segment */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    stroke="#8596ff"
                    strokeDasharray={`${neutralPercent}, 100`}
                    strokeDashoffset="0"
                    strokeWidth="3"
                  />
                  {/* Negative Segment */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    stroke="#ff716c"
                    strokeDasharray={`${negativePercent}, 100`}
                    strokeDashoffset={`-${neutralPercent}`}
                    strokeWidth="3"
                  />
                  {/* Positive Segment */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    stroke="#69f6b8"
                    strokeDasharray={`${positivePercent}, 100`}
                    strokeDashoffset={`-${neutralPercent + negativePercent}`}
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{healthyPercent}%</span>
                  <span className="text-[8px] text-[#adaaaa] uppercase tracking-tighter">Healthy</span>
                </div>
              </>
            )}
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[#adaaaa]">Positive</span>
              </div>
              <span className="text-white font-bold">{positivePercent}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8596ff]" />
                <span className="text-[#adaaaa]">Neutral</span>
              </div>
              <span className="text-white font-bold">{neutralPercent}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff716c]" />
                <span className="text-[#adaaaa]">Negative</span>
              </div>
              <span className="text-white font-bold">{negativePercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-[#201f1f]/50 px-6 py-4 rounded-xl flex flex-wrap gap-6 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest px-1">
            By Keyword
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-black border-none rounded-lg text-xs py-2 px-3 text-white focus:ring-1 focus:ring-primary/40 placeholder:text-[#777575]"
              placeholder="e.g. 'Latency', 'Service'..."
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-48">
          <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest px-1">
            By Sentiment
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border-none rounded-lg text-xs py-2 px-3 pr-10 text-white focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa] pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-48">
          <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest px-1">
            Date Range
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border-none rounded-lg text-xs py-2 px-3 pr-10 text-white focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#1a1919] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#484847]/5 flex justify-between items-center">
          <h4 className="font-bold text-white">Feedback Entries</h4>
          <span className="text-[10px] text-[#adaaaa]">
            {filteredFeedback.length} entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#131313]/50">
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-[#adaaaa] uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <span className="text-[8px]">
                      {sortColumn === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-[#adaaaa] uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center gap-1">
                    Client
                    <span className="text-[8px]">
                      {sortColumn === 'client' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#adaaaa] uppercase tracking-widest">
                  Feedback
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-[#adaaaa] uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('sentiment')}
                >
                  <div className="flex items-center gap-1">
                    Sentiment
                    <span className="text-[8px]">
                      {sortColumn === 'sentiment' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#adaaaa] uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#484847]/5">
              {feedbackLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-64" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : filteredFeedback.length > 0 ? (
                filteredFeedback.map((feedback, index) => {
                  const sentiment = getSentimentLabel(feedback.sentiment_score);
                  return (
                    <tr
                      key={feedback.id}
                      className="hover:bg-[#201f1f]/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      <td className="px-6 py-4 text-xs text-[#adaaaa]">
                        {formatDate(feedback.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-[10px] font-bold ${getAvatarTextColor(index)}`}
                          >
                            {getInitials(feedback.client?.first_name, feedback.client?.last_name)}
                          </div>
                          <span className="text-xs font-semibold text-white">
                            {feedback.client?.first_name} {feedback.client?.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/80 max-w-xs truncate">
                        "{feedback.feedback_message}"
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full ${sentiment.color} text-[10px] font-bold`}
                        >
                          {sentiment.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              feedback.conflict_status === 'active'
                                ? 'bg-[#ff716c]'
                                : feedback.conflict_status === 'resolved'
                                ? 'bg-[#777575]'
                                : 'bg-primary'
                            }`}
                          />
                          <span className="text-[10px] text-[#adaaaa] font-medium">
                            {feedback.conflict_status === 'active'
                              ? 'Pending Review'
                              : feedback.conflict_status === 'resolved'
                              ? 'Resolved'
                              : 'Processed'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#adaaaa]">
                    No feedback entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Feedback Detail Dialog */}
      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedback(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-[#1a1919] border-[#484847]/20">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Feedback Details</DialogTitle>
                <DialogDescription className="text-[#adaaaa]">
                  From {selectedFeedback.client?.first_name} {selectedFeedback.client?.last_name} on{' '}
                  {formatDate(selectedFeedback.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <div className="font-medium mb-1 text-white">Feedback Message:</div>
                  <Card className="bg-[#0e0e0e] border-[#484847]/20">
                    <CardContent className="p-4 text-[#adaaaa]">
                      {selectedFeedback.feedback_message}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="font-medium mb-1 text-white">Sentiment:</div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full ${
                        getSentimentLabel(selectedFeedback.sentiment_score).color
                      } text-[10px] font-bold`}
                    >
                      {getSentimentLabel(selectedFeedback.sentiment_score).label}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1 text-white">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.tags && selectedFeedback.tags.length > 0 ? (
                      selectedFeedback.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-[#262626] text-[#adaaaa]">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[#adaaaa]">No tags</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1 text-white">Client Information:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#adaaaa]">Name:</span>{' '}
                      <span className="text-white">
                        {selectedFeedback.client?.first_name} {selectedFeedback.client?.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#adaaaa]">Phone:</span>{' '}
                      <span className="text-white">{selectedFeedback.client?.phone_number}</span>
                    </div>
                    <div>
                      <span className="text-[#adaaaa]">Email:</span>{' '}
                      <span className="text-white">{selectedFeedback.client?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#adaaaa]">Review Status:</span>{' '}
                      <span className="text-white">
                        {selectedFeedback.client?.review_submitted
                          ? 'Submitted'
                          : selectedFeedback.client?.review_request_sent
                          ? 'Requested'
                          : 'Not Requested'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1 text-white">Conflict Status:</div>
                  <div>
                    {selectedFeedback.conflict_status === 'active' ? (
                      <Badge variant="destructive">Active Conflict</Badge>
                    ) : selectedFeedback.conflict_status === 'resolved' ? (
                      <Badge variant="outline" className="border-[#484847] text-[#adaaaa]">
                        Resolved
                      </Badge>
                    ) : (
                      <span className="text-[#adaaaa]">No conflicts</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
