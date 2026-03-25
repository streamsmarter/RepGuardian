'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Sparkles, 
  AlertTriangle,
  ChevronDown,
  Filter,
  Download,
  Flag,
  Share2,
  Clock,
  Zap,
  ArrowDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
  review_published_at: string | null;
  source: string | null;
  review_url: string | null;
}

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
  const supabase = createBrowserComponentClient();

  // Fetch reviews data
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews-page', companyId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('review') as any)
        .select('id, reviewer_name, stars, body, response_body, review_published_at, source, review_url')
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

  const positivePercent = sentimentStats.total > 0 ? Math.round((sentimentStats.positive / sentimentStats.total) * 100) : 0;

  // Calculate review velocity (this month vs last month)
  const velocityStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { current: 0, change: 0, total: 0 };
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = reviews.filter((r) => {
      if (!r.review_published_at) return false;
      const date = new Date(r.review_published_at);
      return date >= thisMonthStart;
    }).length;

    const lastMonth = reviews.filter((r) => {
      if (!r.review_published_at) return false;
      const date = new Date(r.review_published_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;

    const change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0);

    return { current: thisMonth, change, total: reviews.length };
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

      return true;
    });
  }, [reviews, keywordFilter, platformFilter, sentimentFilter, ratingFilter]);

  const clearFilters = useCallback(() => {
    setKeywordFilter('');
    setPlatformFilter('all');
    setSentimentFilter('all');
    setRatingFilter('all');
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

  // Calculate total strengths and weaknesses for the chart
  const totalStrengths = useMemo(() => {
    if (!reviewsAnalysis?.strengths) return 0;
    return Object.values(reviewsAnalysis.strengths).reduce((sum, val) => sum + val, 0);
  }, [reviewsAnalysis]);

  const totalWeaknesses = useMemo(() => {
    if (!reviewsAnalysis?.weaknesses) return 0;
    return Object.values(reviewsAnalysis.weaknesses).reduce((sum, val) => sum + val, 0);
  }, [reviewsAnalysis]);

  const sentimentTotal = totalStrengths + totalWeaknesses;
  const strengthsPercent = sentimentTotal > 0 ? Math.round((totalStrengths / sentimentTotal) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Intelligence Command Dashboard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[440px]">
        {/* Main Intelligence Panel */}
        <div className="lg:col-span-8 bg-[#101111] rounded-xl relative overflow-hidden border border-[#2d3436] flex flex-col p-8"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(105, 246, 184, 0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start z-10 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Intelligence Command</h2>
              <p className="text-xs text-[#adaaaa] uppercase tracking-[0.3em] font-medium opacity-60">
                Sentinel Analytics Engine // Data Feed: Live
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
          <div className="flex-1 grid grid-cols-12 gap-8 mt-8">
            {/* Left: Sentiment Distribution - Strengths vs Weaknesses */}
            <div className="col-span-4 flex flex-col justify-center border-r border-white/5 pr-8">
              <h3 className="text-sm font-bold text-[#adaaaa] uppercase tracking-[0.15em] mb-6">Sentiment Mix</h3>
              <div className="relative aspect-square w-full flex items-center justify-center">
                {(() => {
                  const circumference = 2 * Math.PI * 14;
                  const strengthsLen = (strengthsPercent / 100) * circumference;
                  const weaknessesPercent = 100 - strengthsPercent;
                  const weaknessesLen = (weaknessesPercent / 100) * circumference;
                  
                  return (
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#201f1f" strokeWidth="4" />
                      {/* Strengths (Green) */}
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke="#69f6b8"
                        strokeWidth="4"
                        strokeDasharray={`${strengthsLen} ${circumference}`}
                        strokeDashoffset="0"
                      />
                      {/* Weaknesses (Red) */}
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke="#ff716c"
                        strokeWidth="4"
                        strokeDasharray={`${weaknessesLen} ${circumference}`}
                        strokeDashoffset={`${-strengthsLen}`}
                      />
                    </svg>
                  );
                })()}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-white font-mono">{strengthsPercent}%</p>
                  <p className="text-xs text-primary uppercase font-bold tracking-widest">Positive</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-2 font-bold text-[#adaaaa]">
                    <span className="w-2 h-2 rounded-sm bg-primary" /> Strengths
                  </span>
                  <span className="text-white font-mono text-sm">{totalStrengths}</span>
                </div>
                <div className="flex justify-between items-center text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-2 font-bold text-[#adaaaa]">
                    <span className="w-2 h-2 rounded-sm bg-[#ff716c]" /> Weaknesses
                  </span>
                  <span className="text-white font-mono text-sm">{totalWeaknesses}</span>
                </div>
              </div>
            </div>

            {/* Right: Tagged Intelligence (Strengths/Weaknesses) */}
            <div className="col-span-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Top Strengths
                  </h3>
                  <div className="space-y-4">
                    {reviewsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))
                    ) : topStrengths.length > 0 ? (
                      topStrengths.map(([name, count]) => (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-white">{name}</span>
                            <span className="text-primary font-mono">{count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#ff716c] uppercase tracking-[0.15em] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Weaknesses
                  </h3>
                  <div className="space-y-4">
                    {reviewsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))
                    ) : topWeaknesses.length > 0 ? (
                      topWeaknesses.map(([name, count]) => (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-white">{name}</span>
                            <span className="text-[#ff716c] font-mono">{count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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

              {/* Velocity Insight Card */}
              <div className="p-4 bg-white/5 border border-white/5 rounded flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-[#262626] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-[#adaaaa] uppercase tracking-widest font-bold">Monthly Velocity</p>
                    <p className="text-sm text-white font-mono">
                      {velocityStats.change >= 0 ? '+' : ''}{velocityStats.current} reviews this month
                      <span className="text-xs text-[#adaaaa] font-normal tracking-normal ml-1 lowercase">({velocityStats.change >= 0 ? '+' : ''}{velocityStats.change}% vs last)</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 h-6 items-end">
                  <div className="w-1 bg-white/10 h-[40%]" />
                  <div className="w-1 bg-white/10 h-[60%]" />
                  <div className="w-1 bg-white/10 h-[45%]" />
                  <div className="w-1 bg-white/10 h-[70%]" />
                  <div className="w-1 bg-primary h-[90%] shadow-[0_0_8px_rgba(105,246,184,0.4)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Stats */}
        <div className="lg:col-span-4 bg-[#1a1919] rounded-xl p-6 border border-white/5 flex flex-col gap-4">
          {/* Critical Review Alerts */}
          <div>
            <h3 className="text-sm font-black mb-4 uppercase tracking-[0.15em] text-[#ff716c] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              Critical Alerts
            </h3>
            <div className="space-y-3">
              {reviewsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : criticalReviews.length > 0 ? (
                criticalReviews.map((review, index) => (
                  <div 
                    key={review.id}
                    className={`p-3 rounded-lg ${index === 0 ? 'bg-[#1a1313] border border-[#ff716c]/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-[#141414] border border-white/5'} group cursor-pointer hover:border-[#ff716c]/40 transition-all`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${index === 0 ? 'text-[#ff716c]' : 'text-[#adaaaa]'}`}>
                        {index === 0 ? 'Immediate Response' : 'Priority Review'}
                      </span>
                      <span className="text-xs text-[#adaaaa]/50 font-mono">{formatTimeAgo(review.review_published_at)}</span>
                    </div>
                    <p className="text-sm text-white font-medium leading-tight line-clamp-2">
                      &quot;{review.body?.slice(0, 80)}...&quot;
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#adaaaa]">No critical alerts</p>
              )}
            </div>
          </div>

          {/* AI Engagement Performance */}
          <div className="border-t border-white/5 pt-4">
            <h3 className="text-sm font-black mb-3 uppercase tracking-[0.15em] text-[#adaaaa] flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI Performance
            </h3>
            <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#adaaaa]">AI Response Coverage</span>
                  <span className="text-sm font-bold text-primary font-mono">{aiStats.coverage}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_8px_rgba(105,246,184,0.4)]" style={{ width: `${aiStats.coverage}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#adaaaa]">Human Hand-off</p>
                  <p className="text-lg font-bold text-white font-mono">{aiStats.humanHandoff.toFixed(1)}%</p>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#adaaaa]">Auto-Resolved</p>
                  <p className="text-lg font-bold text-primary font-mono">{aiStats.autoResolved}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Efficiency */}
          <div className="border-t border-white/5 pt-4">
            <h3 className="text-sm font-black mb-2 uppercase tracking-[0.15em] text-[#adaaaa]">Response Efficiency</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-[#adaaaa]/60 uppercase tracking-wider mb-1">Avg. Response Time (30d)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary font-mono">4.2m</span>
                  <span className="text-xs text-primary flex items-center gap-0.5 font-bold">
                    <TrendingDown className="w-3 h-3" />18%
                  </span>
                </div>
              </div>
              <div className="flex gap-1 h-6 items-end">
                <div className="w-0.5 bg-primary/20 h-[80%]" />
                <div className="w-0.5 bg-primary/20 h-[70%]" />
                <div className="w-0.5 bg-primary/20 h-[60%]" />
                <div className="w-0.5 bg-primary/20 h-[50%]" />
                <div className="w-0.5 bg-primary/20 h-[40%]" />
                <div className="w-0.5 bg-primary h-[30%] shadow-[0_0_8px_rgba(105,246,184,0.4)]" />
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
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa]" />
              <input
                type="text"
                className="w-full bg-[#1a1919] border-none text-sm py-3 pl-10 rounded focus:ring-1 focus:ring-primary/20 text-white placeholder:text-[#adaaaa]/50"
                placeholder="Filter by keyword..."
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="bg-[#1a1919] border-none text-sm py-3 px-4 pr-10 rounded focus:ring-1 focus:ring-primary/20 text-[#adaaaa] appearance-none cursor-pointer"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="all">Rating (Any)</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3-">3 Stars or less</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa] pointer-events-none" />
            </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Incoming Intelligence <span className="text-primary ml-2">{filteredReviews.length}</span>
          </h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-[#201f1f] hover:bg-[#262626] text-[#adaaaa] transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-[#201f1f] hover:bg-[#262626] text-[#adaaaa] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
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

                    {hasResponse ? (
                      <div className="flex items-center gap-4 bg-[#201f1f]/50 p-4 rounded-xl border border-white/5">
                        <Zap className="w-4 h-4 text-primary" />
                        <p className="text-[11px] text-[#adaaaa] font-medium italic">
                          Sent automated response via AI Autopilot.
                        </p>
                        <div className="flex-1" />
                        <button className="text-[10px] text-primary font-bold uppercase tracking-widest">View Thread</button>
                      </div>
                    ) : (
                      <div className="flex gap-4 pt-2">
                        <Button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all">
                          <Zap className="w-4 h-4" />
                          Draft AI Response
                        </Button>
                        <Button variant="outline" className="px-5 py-2.5 bg-[#262626] text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/5 hover:bg-[#2c2c2c] transition-colors">
                          Manual Reply
                        </Button>
                        <div className="flex-1" />
                        <button className="text-[#adaaaa] hover:text-[#ff716c] transition-colors">
                          <Flag className="w-5 h-5" />
                        </button>
                        <button className="text-[#adaaaa] hover:text-secondary transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
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
              Scan Deeper Archives
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
