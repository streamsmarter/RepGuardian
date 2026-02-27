"use client"

import { Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createBrowserComponentClient } from '@/lib/supabase/client'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Review {
  id: string
  reviewer_name: string | null
  stars: number | null
  body: string | null
  review_published_at: string | null
  source: string | null
}

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

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('review') as any)
        .select('id, reviewer_name, stars, body, review_published_at, source')
        .eq('company_id', companyId)
        .order('review_published_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data as Review[]
    },
    enabled: !!companyId,
  })

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
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {reviews.map((review) => (
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
                </div>
                <span className="text-sm text-muted-foreground">
                  {review.review_published_at ? formatDate(review.review_published_at) : ''}
                </span>
              </div>
              <StarRating rating={review.stars || 0} />
              <p className="text-sm text-muted-foreground mt-2">
                {review.body || 'No review text'}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
