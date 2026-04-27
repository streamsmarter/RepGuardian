/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Sparkles, 
  AlertTriangle,
  ChevronDown,
  Clock,
  Zap,
  ArrowDown,
  CheckCircle2,
  Send,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GoogleRatingGaugeCard } from '@/components/dashboard/google-rating-gauge-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ReviewsAnalysis {
  strengths: Record<string, number>;
  weaknesses: Record<string, number>;
}

interface ReviewsPageClientProps {
  companyId: string;
  reviewsAnalysis: ReviewsAnalysis | null;
  initialPlatform: string;
  initialSentiment: string;
  initialRating: string;
  initialSearch: string;
}

interface Review {
  id: string;
  reviewer_name: string | null;
  stars: number | null;
  body: string | null;
  response_body: string | null;
  response_date: string | null;
  review_published_at: string | null;
  source: string | null;
  review_url: string | null;
}

const ratingFilterOptions = [
  { value: 'all', label: 'Any rating' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3-', label: '3 Stars or less' },
];

const replyFilterOptions = [
  { value: 'all', label: 'Any status' },
  { value: 'replied', label: 'Replied' },
  { value: 'unreplied', label: 'Not Replied' },
];

export function ReviewsPageClient({
  companyId,
  reviewsAnalysis,
  initialPlatform,
  initialSentiment,
  initialRating,
  initialSearch,
}: ReviewsPageClientProps) {
  const [keywordFilter, setKeywordFilter] = useState(initialSearch);
  const [platformFilter, setPlatformFilter] = useState(initialPlatform);
  const [sentimentFilter, setSentimentFilter] = useState(initialSentiment);
  const [ratingFilter, setRatingFilter] = useState(initialRating);
  const [visibleCount, setVisibleCount] = useState(10);
  const [replyFilter, setReplyFilter] = useState('all');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [manualReply, setManualReply] = useState('');
  const [aiSuggestionReviewId, setAiSuggestionReviewId] = useState<string | null>(null);
  const [aiSuggestionText, setAiSuggestionText] = useState('');
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();
  const selectedRatingLabel = ratingFilterOptions.find((option) => option.value === ratingFilter)?.label ?? 'Any rating';
  const selectedReplyLabel = replyFilterOptions.find((option) => option.value === replyFilter)?.label ?? 'Any status';

  // Fetch reviews data
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews-page', companyId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('review') as any)
        .select('id, reviewer_name, stars, body, response_body, response_date, review_published_at, source, review_url')
        .eq('company_id', companyId)
        .order('review_published_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Review[];
    },
    staleTime: 30_000,
    enabled: !!companyId,
  });

  const reviews = reviewsData || [];

  // Calculate sentiment stats
  const sentimentStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { positive: 0, neutral: 0, frustrated: 0, total: 0 };
    
    const positive = reviews.filter((r) => r.stars !== null && r.stars >= 4).length;
    const frustrated = reviews.filter((r) => r.stars !== null && r.stars <= 2).length;
    const neutral = reviews.filter((r) => r.stars === 3).length;
    
    return { positive, neutral, frustrated, total: reviews.length };
  }, [reviews]);

  const averageGoogleRating = useMemo(() => {
    const googleReviews = reviews.filter(
      (review) => review.stars !== null && (review.source || '').toLowerCase().includes('google')
    );

    if (googleReviews.length === 0) {
      return 0;
    }

    const totalStars = googleReviews.reduce((sum, review) => sum + (review.stars || 0), 0);
    return totalStars / googleReviews.length;
  }, [reviews]);

  // Calculate review velocity (this month vs last month)
  const velocityStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { current: 0, positive: 0, change: 0, total: 0 };
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = reviews.filter((r) => {
      if (!r.review_published_at) return false;
      const date = new Date(r.review_published_at);
      return date >= thisMonthStart;
    }).length;

    const positiveThisMonth = reviews.filter((r) => {
      if (!r.review_published_at || r.stars === null) return false;
      const date = new Date(r.review_published_at);
      return date >= thisMonthStart && r.stars >= 4;
    }).length;

    const lastMonth = reviews.filter((r) => {
      if (!r.review_published_at) return false;
      const date = new Date(r.review_published_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;

    const change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0);

    return { current: thisMonth, positive: positiveThisMonth, change, total: reviews.length };
  }, [reviews]);

  // Get critical reviews (low rating, recent, no response)
  const criticalReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    return reviews
      .filter((r) => r.stars !== null && r.stars <= 2 && !r.response_body?.trim())
      .slice(0, 3);
  }, [reviews]);

  // AI performance stats
  const aiStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { coverage: 0, autoResolved: 0, humanHandoff: 0 };
    
    const responded = reviews.filter((r) => r.response_body?.trim()).length;
    const coverage = reviews.length > 0 ? Math.round((responded / reviews.length) * 100 * 10) / 10 : 0;
    
    return {
      coverage,
      autoResolved: responded,
      humanHandoff: 100 - coverage,
    };
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    return reviews.filter((review) => {
      // Keyword filter
      if (keywordFilter) {
        const searchTerm = keywordFilter.toLowerCase();
        const haystack = [
          review.reviewer_name || '',
          review.body || '',
          review.response_body || '',
          review.source || '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }

      // Platform filter
      if (platformFilter !== 'all') {
        const source = (review.source || '').toLowerCase();
        if (platformFilter === 'google' && !source.includes('google')) return false;
        if (platformFilter === 'yelp' && !source.includes('yelp')) return false;
        if (platformFilter === 'trustpilot' && !source.includes('trustpilot')) return false;
      }

      // Sentiment filter
      if (sentimentFilter !== 'all') {
        const stars = review.stars || 0;
        if (sentimentFilter === 'positive' && stars < 4) return false;
        if (sentimentFilter === 'frustrated' && stars > 2) return false;
        if (sentimentFilter === 'neutral' && stars !== 3) return false;
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const stars = review.stars || 0;
        if (ratingFilter === '5' && stars !== 5) return false;
        if (ratingFilter === '4' && stars !== 4) return false;
        if (ratingFilter === '3-' && stars > 3) return false;
      }

      // Reply filter
      if (replyFilter !== 'all') {
        const hasReply = !!review.response_body?.trim();
        if (replyFilter === 'replied' && !hasReply) return false;
        if (replyFilter === 'unreplied' && hasReply) return false;
      }

      return true;
    });
  }, [reviews, keywordFilter, platformFilter, sentimentFilter, ratingFilter, replyFilter]);

  const clearFilters = useCallback(() => {
    setKeywordFilter('');
    setPlatformFilter('all');
    setSentimentFilter('all');
    setRatingFilter('all');
    setReplyFilter('all');
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatResponseDate = (dateString: string | null) => {
    if (!dateString) return 'Response date unavailable';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSentimentLabel = (stars: number | null) => {
    if (stars === null) return { label: 'Unknown', color: 'bg-[#777575]/10 text-[#777575] border-[#777575]/20' };
    if (stars >= 4) return { label: 'Positive', color: 'bg-primary/10 text-primary border-primary/20' };
    if (stars === 3) return { label: 'Constructive', color: 'bg-secondary/10 text-secondary border-secondary/20' };
    return { label: 'Frustrated', color: 'bg-[#ff716c]/10 text-[#ff716c] border-[#ff716c]/20' };
  };

  // Get top strengths and weaknesses
  const topStrengths = useMemo(() => {
    if (!reviewsAnalysis?.strengths) return [];
    return Object.entries(reviewsAnalysis.strengths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [reviewsAnalysis]);

  const topWeaknesses = useMemo(() => {
    if (!reviewsAnalysis?.weaknesses) return [];
    return Object.entries(reviewsAnalysis.weaknesses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [reviewsAnalysis]);

  const maxStrength = topStrengths.length > 0 ? topStrengths[0][1] : 1;
  const maxWeakness = topWeaknesses.length > 0 ? topWeaknesses[0][1] : 1;

  const saveReviewReplyMutation = useMutation({
    mutationFn: async ({ reviewId, responseBody }: { reviewId: string; responseBody: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('review') as any)
        .update({
          response_body: responseBody.trim(),
          response_date: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }
    },
  });

  const requestReviewReplyMutation = useMutation({
    mutationFn: async ({
      reviewId,
      replyText,
      reviewType,
    }: {
      reviewId: string;
      replyText: string;
      reviewType: 'human' | 'ai';
    }) => {
      const response = await fetch('/api/review-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_id: reviewId,
          company_id: companyId,
          reply_text: replyText,
          review_type: reviewType,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; reply_text?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to contact reply webhook');
      }

      return payload;
    },
  });

  const completeReplySubmission = useCallback(
    async (reviewId: string, responseBody: string, successMessage: string) => {
      await saveReviewReplyMutation.mutateAsync({ reviewId, responseBody });
      toast.success(successMessage);
      setExpandedReviewId(reviewId);
      setReplyingReviewId(null);
      setManualReply('');
      setAiSuggestionReviewId(null);
      setAiSuggestionText('');
      queryClient.invalidateQueries({ queryKey: ['reviews-page', companyId] });
    },
    [companyId, queryClient, saveReviewReplyMutation]
  );

  const handleDraftAiResponse = useCallback(
    async (reviewId: string) => {
      try {
        setReplyingReviewId(null);
        setManualReply('');
        setAiSuggestionReviewId(reviewId);
        setAiSuggestionText('');

        const payload = await requestReviewReplyMutation.mutateAsync({
          reviewId,
          replyText: '',
          reviewType: 'ai',
        });

        const suggestedReply = payload.reply_text?.trim();

        if (!suggestedReply) {
          throw new Error('Webhook returned an empty AI reply');
        }

        setAiSuggestionText(suggestedReply);
        toast.success('AI draft ready to review');
      } catch (error: unknown) {
        setAiSuggestionReviewId(null);
        setAiSuggestionText('');
        toast.error(error instanceof Error ? error.message : 'Failed to draft AI response');
      }
    },
    [requestReviewReplyMutation]
  );

  const handleApproveAiSuggestion = useCallback(
    async (reviewId: string) => {
      const suggestion = aiSuggestionText.trim();
      if (!suggestion) return;

      try {
        await completeReplySubmission(reviewId, suggestion, 'AI reply approved and saved');
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to approve AI reply');
      }
    },
    [aiSuggestionText, completeReplySubmission]
  );

  const clearAiSuggestion = useCallback(() => {
    setAiSuggestionReviewId(null);
    setAiSuggestionText('');
  }, []);

  const handleManualReplySubmit = useCallback(
    async (reviewId: string, event: React.FormEvent) => {
      event.preventDefault();
      const responseBody = manualReply.trim();
      if (!responseBody) return;

      try {
        await requestReviewReplyMutation.mutateAsync({
          reviewId,
          replyText: responseBody,
          reviewType: 'human',
        });

        await completeReplySubmission(
          reviewId,
          responseBody,
          'Reply sent'
        );
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit reply');
      }
    },
    [completeReplySubmission, manualReply, requestReviewReplyMutation]
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* Intelligence Command Dashboard */}
      <section>
        {/* Main Intelligence Panel */}
        <div className="bg-[#101111] rounded-xl relative overflow-hidden border border-[#2d3436] flex flex-col p-4 md:p-8"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(105, 246, 184, 0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start z-10 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Reviews Panel</h2>
              <p className="text-xs text-[#adaaaa] uppercase tracking-[0.3em] font-medium opacity-60">
                Recent Feedback Analysis
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-[#adaaaa] uppercase tracking-widest">Total Reviews</span>
              <div className="flex items-center gap-2">
                {reviewsLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <>
                    <span className="text-xl font-bold text-white font-mono">{velocityStats.total}</span>
                    <span className={`text-xs flex items-center gap-0.5 font-bold ${velocityStats.change >= 0 ? 'text-primary' : 'text-[#ff716c]'}`}>
                      {velocityStats.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(velocityStats.change)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Data Visualization Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-6 md:mt-8">
            <GoogleRatingGaugeCard rating={averageGoogleRating} isLoading={reviewsLoading} />

            {/* Middle: Tagged Intelligence (Strengths/Weaknesses) */}
            <div className="col-span-1 md:col-span-6 grid grid-cols-2 gap-4 md:gap-6 items-center">
              {/* Strengths */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Top Strengths
                </h3>
                <div className="space-y-3 max-h-[140px] overflow-hidden">
                  {reviewsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))
                  ) : topStrengths.length > 0 ? (
                    topStrengths.map(([name, count]) => (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-white truncate">{name.replaceAll('_', ' ')}</span>
                          <span className="text-primary font-mono">{count}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/40 border-r border-primary" 
                            style={{ width: `${(count / maxStrength) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#adaaaa]">No data available</p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#ff716c] uppercase tracking-[0.15em] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Top Weaknesses
                </h3>
                <div className="space-y-3 max-h-[140px] overflow-hidden">
                  {reviewsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))
                  ) : topWeaknesses.length > 0 ? (
                    topWeaknesses.map(([name, count]) => (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-white truncate">{name.replaceAll('_', ' ')}</span>
                          <span className="text-[#ff716c] font-mono">{count}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#ff716c]/40 border-r border-[#ff716c]" 
                            style={{ width: `${(count / maxWeakness) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#adaaaa]">No data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Velocity Insight Card */}
            <div className="col-span-1 md:col-span-3 flex flex-col justify-center md:border-l border-white/5 md:pl-6">
              <div className="p-4 bg-white/5 border border-white/5 rounded">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-[#262626] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-xs text-[#adaaaa] uppercase tracking-widest font-bold">Monthly Velocity</p>
                </div>
                <p className="text-sm text-white font-mono">
                  {velocityStats.change >= 0 ? '+' : ''}{velocityStats.current} reviews
                  <span className="text-xs text-[#adaaaa] font-normal tracking-normal ml-1 lowercase">this month</span>
                </p>
                <p className="text-xs text-primary font-bold mt-1">
                  {velocityStats.positive} positive
                </p>
                <div className="flex gap-1 h-6 items-end mt-3">
                  <div className="w-1.5 bg-white/10 h-[40%] rounded-sm" />
                  <div className="w-1.5 bg-white/10 h-[60%] rounded-sm" />
                  <div className="w-1.5 bg-white/10 h-[45%] rounded-sm" />
                  <div className="w-1.5 bg-white/10 h-[70%] rounded-sm" />
                  <div className="w-1.5 bg-primary h-[90%] rounded-sm shadow-[0_0_8px_rgba(105,246,184,0.4)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filtering Suite */}
      <section className="bg-[#131313] rounded-xl p-4 border border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#1a1919] border-none text-sm py-3 px-4 rounded focus:ring-1 focus:ring-primary/20 text-white placeholder:text-[#adaaaa]/50"
                placeholder="Filter by keyword..."
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 min-w-[160px] items-center justify-between gap-3 rounded border border-white/8 bg-[#0e0e0e]/80 px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl transition-all hover:border-primary/20 hover:bg-[#141414]/85 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span>{selectedRatingLabel}</span>
                  <ChevronDown className="h-4 w-4 text-[#8d8d8d]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="min-w-[220px] rounded border border-white/8 bg-[#0e0e0e]/88 p-2 text-white shadow-none backdrop-blur-xl"
              >
                {ratingFilterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setRatingFilter(option.value)}
                    className={`rounded px-3 py-3 text-sm font-medium transition-colors ${
                      ratingFilter === option.value
                        ? 'bg-primary/12 text-primary'
                        : 'text-[#d0d0d0] focus:bg-white/5 focus:text-white'
                    }`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 min-w-[190px] items-center justify-between gap-3 rounded border border-white/8 bg-[#0e0e0e]/80 px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl transition-all hover:border-primary/20 hover:bg-[#141414]/85 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span>{selectedReplyLabel}</span>
                  <ChevronDown className="h-4 w-4 text-[#8d8d8d]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="min-w-[220px] rounded border border-white/8 bg-[#0e0e0e]/88 p-2 text-white shadow-none backdrop-blur-xl"
              >
                {replyFilterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setReplyFilter(option.value)}
                    className={`rounded px-3 py-3 text-sm font-medium transition-colors ${
                      replyFilter === option.value
                        ? 'bg-primary/12 text-primary'
                        : 'text-[#d0d0d0] focus:bg-white/5 focus:text-white'
                    }`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="h-8 w-px bg-white/5 mx-2" />
          <button 
            onClick={clearFilters}
            className="bg-[#262626] px-5 py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#2c2c2c] transition-colors text-white"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Tactical Review Feed */}
      <section className="space-y-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Incoming Reviews</h2>
        </div>

        {/* Review Cards */}
        {reviewsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="bg-[#1a1919] rounded-xl p-12 text-center">
            <p className="text-[#adaaaa]">No reviews match your current filters.</p>
          </div>
        ) : (
          filteredReviews.slice(0, visibleCount).map((review, index) => {
            const sentiment = getSentimentLabel(review.stars);
            const hasResponse = !!review.response_body?.trim();

            return (
              <article 
                key={review.id}
                className={`bg-[#1a1919] rounded-xl p-6 transition-all hover:translate-x-1 group ${hasResponse ? 'opacity-80 grayscale-[40%]' : ''}`}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-[#262626] flex items-center justify-center">
                      <span className="text-lg font-bold text-[#adaaaa]">
                        {(review.reviewer_name || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="bg-[#262626] px-2 py-0.5 rounded text-[9px] font-black text-[#adaaaa] uppercase tracking-tighter">
                      {review.source || 'Unknown'}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white">{review.reviewer_name || 'Anonymous'}</h4>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= (review.stars || 0) ? 'fill-primary text-primary' : 'text-[#adaaaa]'}`}
                              style={{ fontVariationSettings: star <= (review.stars || 0) ? "'FILL' 1" : "'FILL' 0" }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#adaaaa]/60 font-medium">{formatDate(review.review_published_at)}</span>
                        <div className={`px-3 py-1 ${sentiment.color} border rounded-full text-[10px] font-bold tracking-widest uppercase`}>
                          {sentiment.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#adaaaa] leading-relaxed max-w-3xl">
                      {review.body || 'No review text'}
                    </p>

                    {!hasResponse && aiSuggestionReviewId === review.id && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                          AI Suggestion
                        </p>
                        {aiSuggestionText ? (
                          <p className="mt-2 text-sm leading-relaxed text-white">
                            {aiSuggestionText}
                          </p>
                        ) : (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-primary/70 italic">AI is crafting a response...</span>
                          </div>
                        )}
                        {aiSuggestionText && (
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDraftAiResponse(review.id)}
                              disabled={requestReviewReplyMutation.isPending || saveReviewReplyMutation.isPending}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#262626] text-[#adaaaa] transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                              title="Regenerate response"
                            >
                              <RefreshCw className={`h-4 w-4 ${requestReviewReplyMutation.isPending ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(aiSuggestionText);
                                toast.success('Response copied to clipboard');
                              }}
                              disabled={requestReviewReplyMutation.isPending || saveReviewReplyMutation.isPending}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-[#002919] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {hasResponse ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 bg-[#201f1f]/50 p-4 rounded-xl border border-white/5">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <p className="text-[11px] text-[#adaaaa] font-medium">
                            Sent on {formatResponseDate(review.response_date)}
                          </p>
                          <div className="flex-1" />
                          <button 
                            onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                            className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline cursor-pointer"
                          >
                            {expandedReviewId === review.id ? 'Hide Reply' : 'View Reply'}
                          </button>
                        </div>
                        {expandedReviewId === review.id && (
                          <div className="bg-[#1a1919] p-4 rounded-lg border border-primary/20 ml-8">
                            <p className="text-xs text-[#adaaaa] uppercase tracking-widest mb-2 font-bold">Your Response</p>
                            <p className="text-sm text-white leading-relaxed">{review.response_body}</p>
                          </div>
                        )}
                      </div>
                    ) : aiSuggestionReviewId !== review.id && (
                      <div className="flex gap-4 pt-2">
                        <Button
                          type="button"
                          onClick={() => handleDraftAiResponse(review.id)}
                          disabled={requestReviewReplyMutation.isPending || saveReviewReplyMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-60"
                        >
                          <Zap className="w-4 h-4" />
                          {requestReviewReplyMutation.isPending && aiSuggestionReviewId === review.id ? 'Drafting...' : 'Draft AI Response'}
                        </Button>
                      </div>
                    )}

                    {!hasResponse && replyingReviewId === review.id && (
                      <form onSubmit={(event) => handleManualReplySubmit(review.id, event)} className="relative group pt-3">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
                        <div className="relative flex items-end gap-3 bg-[#131313] rounded-2xl p-4 pl-6 border border-white/5 group-focus-within:border-primary/30 transition-all">
                          <textarea
                            rows={2}
                            placeholder="Write your response..."
                            value={manualReply}
                            onChange={(event) => setManualReply(event.target.value)}
                            disabled={requestReviewReplyMutation.isPending || saveReviewReplyMutation.isPending}
                            className="flex-1 resize-none bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-white placeholder:text-[#adaaaa]/40"
                          />
                          <div className="flex items-center pr-2">
                            <button
                              type="submit"
                              disabled={!manualReply.trim() || requestReviewReplyMutation.isPending || saveReviewReplyMutation.isPending}
                              className="min-w-10 h-10 px-3 bg-primary rounded-xl flex items-center justify-center gap-2 text-[#002919] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}

        {/* Load More */}
        {filteredReviews.length > visibleCount && (
          <div className="flex justify-center py-12">
            <button 
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="flex items-center gap-3 px-10 py-4 bg-[#262626] rounded-xl text-white text-xs font-bold uppercase tracking-[0.2em] border border-white/5 hover:border-primary/30 hover:bg-[#2c2c2c] transition-all group"
            >
              See More
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
