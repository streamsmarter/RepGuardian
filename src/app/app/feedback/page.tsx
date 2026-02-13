export const dynamic = 'force-dynamic';

import { getCompanyContext } from '@/lib/company-context';
import { FeedbackTable } from '@/components/feedback-table';
import { FeedbackChart } from '@/components/feedback-chart';
import { FeedbackDonutChart } from '@/components/feedback-donut-chart';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { sentiment?: string; search?: string };
}) {
  const { company_id } = await getCompanyContext();
  const sentiment = searchParams.sentiment || 'all';
  const search = searchParams.search || '';
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Feedback</h1>
        <p className="text-muted-foreground">
          Review and manage customer feedback and sentiment.
        </p>
      </div>

      <div className="flex gap-4 h-[356px]">
        <div className="flex-1 h-full">
          <FeedbackChart companyId={company_id} />
        </div>
        <div className="h-full aspect-square rounded-xl border bg-card p-4">
          <FeedbackDonutChart companyId={company_id} />
        </div>
      </div>
      
      <FeedbackTable 
        companyId={company_id} 
        initialSentiment={sentiment}
        initialSearch={search}
      />
    </div>
  );
}
