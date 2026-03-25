/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createBrowserComponentClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Review {
  id: string
  reviewer_name: string | null
  stars: number | null
  body: string | null
  response_body: string | null
  review_published_at: string | null
  source: string | null
}

type SentimentFilter = 'all' | 'positive' | 'negative'
type ResponseFilter = 'all' | 'responded' | 'unresponded'

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface ReviewsListProps {
  companyId: string
}

export function ReviewsList({ companyId }: ReviewsListProps) {
  const supabase = createBrowserComponentClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>('all')

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('review') as any)
        .select('id, reviewer_name, stars, body, response_body, review_published_at, source')
        .eq('company_id', companyId)
        .order('review_published_at', { ascending: false })
      
      if (error) throw error
      return data as Review[]
    },
    enabled: !!companyId,
  })

  const filteredReviews = useMemo(() => {
    const searchTerm = searchQuery.trim().toLowerCase()

    return (reviews ?? []).filter((review) => {
      const rating = review.stars ?? 0
      const hasResponse = !!review.response_body?.trim()

      if (sentimentFilter === 'positive' && rating < 4) return false
      if (sentimentFilter === 'negative' && rating >= 4) return false

      if (responseFilter === 'responded' && !hasResponse) return false
      if (responseFilter === 'unresponded' && hasResponse) return false

      if (!searchTerm) return true

      const haystack = [
        review.reviewer_name ?? '',
        review.body ?? '',
        review.response_body ?? '',
        review.source ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(searchTerm)
    })
  }, [reviews, responseFilter, searchQuery, sentimentFilter])

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Loading reviews...
        </div>
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No reviews found
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviewer, review text, source..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={sentimentFilter} onValueChange={(value) => setSentimentFilter(value as SentimentFilter)}>
          <SelectTrigger className="w-full lg:w-[170px]">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sentiment</SelectItem>
            <SelectItem value="positive">Positive (4-5 stars)</SelectItem>
            <SelectItem value="negative">Negative (&lt;4 stars)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={responseFilter} onValueChange={(value) => setResponseFilter(value as ResponseFilter)}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Response" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All responses</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="unresponded">No response</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {filteredReviews.length} result{filteredReviews.length === 1 ? '' : 's'}
      </p>

      <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No reviews match your current filters.
            </div>
          ) : (
            filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg bg-muted/30 border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
                  {review.source && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {review.source}
                    </span>
                  )}
                  <Badge variant={review.stars && review.stars >= 4 ? 'secondary' : 'outline'}>
                    {review.stars && review.stars >= 4 ? 'Positive' : 'Negative'}
                  </Badge>
                  <Badge variant={review.response_body?.trim() ? 'secondary' : 'outline'}>
                    {review.response_body?.trim() ? 'Responded' : 'No response'}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {review.review_published_at ? formatDate(review.review_published_at) : ''}
                </span>
              </div>
              <StarRating rating={review.stars || 0} />
              <p className="text-sm text-muted-foreground mt-2">
                {review.body || 'No review text'}
              </p>

              {review.response_body?.trim() && (
                <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-medium text-emerald-600">Owner response</p>
                  <p className="mt-1 text-sm text-muted-foreground">{review.response_body}</p>
                </div>
              )}
            </div>
          ))
          )}
      </div>
    </div>
  )
}
