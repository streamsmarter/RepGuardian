import { getCompanyContext } from '@/lib/company-context';
import { FeedbackTable } from '@/components/feedback-table';

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
      
      <FeedbackTable 
        companyId={company_id} 
        initialSentiment={sentiment}
        initialSearch={search}
      />
    </div>
  );
}
