"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackTable } from '@/components/feedback-table'
import { FeedbackChart } from '@/components/feedback-chart'
import { FeedbackDonutChart } from '@/components/feedback-donut-chart'
import { ReviewsCharts } from '@/components/reviews-radar-chart'
import { ReviewsList } from '@/components/reviews-list'

interface ReviewsAnalysis {
  strengths: Record<string, number>
  weaknesses: Record<string, number>
}

interface FeedbackTabsProps {
  companyId: string
  initialSentiment: string
  initialSearch: string
  reviewsAnalysis: ReviewsAnalysis | null
}

export function FeedbackTabs({ 
  companyId, 
  initialSentiment, 
  initialSearch,
  reviewsAnalysis 
}: FeedbackTabsProps) {
  return (
    <Tabs defaultValue="feedback" className="w-full">
      <TabsList>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      
      <TabsContent value="feedback" className="space-y-6 mt-6">
        <div className="flex gap-4 h-[356px]">
          <div className="flex-1 h-full">
            <FeedbackChart companyId={companyId} />
          </div>
          <div className="h-full aspect-square rounded-xl border bg-card p-4">
            <FeedbackDonutChart companyId={companyId} />
          </div>
        </div>
        
        <FeedbackTable 
          companyId={companyId} 
          initialSentiment={initialSentiment}
          initialSearch={initialSearch}
        />
      </TabsContent>
      
      <TabsContent value="reviews" className="mt-6 space-y-6">
        <ReviewsCharts reviewsAnalysis={reviewsAnalysis} />
        <ReviewsList companyId={companyId} />
      </TabsContent>
    </Tabs>
  )
}
