export const dynamic = 'force-dynamic';

import { getCompanyContext } from '@/lib/company-context';
import { createServerComponentClient } from '@/lib/supabase/server';
import { ReviewsPageClient } from './reviews-client';

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

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; sentiment?: string; rating?: string; search?: string }>;
}) {
  const { company_id } = await getCompanyContext();
  const reviewsAnalysis = await getReviewsAnalysis(company_id);
  const params = await searchParams;

  return (
    <ReviewsPageClient
      companyId={company_id}
      reviewsAnalysis={reviewsAnalysis}
      initialPlatform={params.platform || 'all'}
      initialSentiment={params.sentiment || 'all'}
      initialRating={params.rating || 'all'}
      initialSearch={params.search || ''}
    />
  );
}
