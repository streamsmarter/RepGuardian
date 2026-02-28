export const dynamic = 'force-dynamic';

import { getCompanyContext } from '@/lib/company-context';
import { createServerComponentClient } from '@/lib/supabase/server';
import { FeedbackTabs } from '@/components/feedback-tabs';

type ReviewsAnalysis = {
  strengths: Record<string, number>;
  weaknesses: Record<string, number>;
};

type CompanyReviewsAnalysisRow = {
  reviews_analysis?: ReviewsAnalysis | null;
};

async function getReviewsAnalysis(companyId: string): Promise<ReviewsAnalysis | null> {
  const supabase = await createServerComponentClient();
  const { data } = await supabase.from('company').select('reviews_analysis').eq('id', companyId).single();
  const analysis = (data as CompanyReviewsAnalysisRow | null)?.reviews_analysis;

  if (!analysis?.strengths || !analysis?.weaknesses) {
    return null;
  }

  return analysis;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { sentiment?: string; search?: string };
}) {
  const { company_id } = await getCompanyContext();
  const sentiment = searchParams.sentiment || 'all';
  const search = searchParams.search || '';
  const reviewsAnalysis = await getReviewsAnalysis(company_id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Feedback</h1>
        <p className="text-muted-foreground">Review and manage customer feedback and sentiment.</p>
      </div>

      <FeedbackTabs
        companyId={company_id}
        initialSentiment={sentiment}
        initialSearch={search}
        reviewsAnalysis={reviewsAnalysis}
      />
    </div>
  );
}
