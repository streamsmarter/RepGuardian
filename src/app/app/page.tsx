import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { MessageSquare, Heart, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { CriticalUpdates } from '@/components/critical-updates';
import { ReviewsTrendChart } from '@/components/reviews-trend-chart';

export const dynamic = 'force-dynamic';

type CompanyReputation = {
  reputation_score?: {
    company_reputation_score?: number;
  };
};

function getReputationIndicator(score: number): string {
  if (score === 0) return 'Unknown';
  if (score < 3) return 'Terrible';
  if (score < 4) return 'Bad';
  if (score < 4.7) return 'Moderate';
  return 'Healthy';
}

async function getKpiData(companyId: string) {
  const supabase = await createServerComponentClient();

  // Active Conversations - count of chats for this company
  const { count: activeConversations } = await supabase
    .from('chat')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  // Health Score - from company's reputation_score object
  const { data: companyData } = await supabase
    .from('company')
    .select('reputation_score')
    .eq('id', companyId)
    .single();

  const reputationScoreValue =
    (companyData as CompanyReputation | null)?.reputation_score?.company_reputation_score || 0;

  const reputationIndicator = getReputationIndicator(reputationScoreValue);

  // Needs Attention - count clients with status "conflict" or "needs_human"
  const { count: attentionCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['conflict', 'needs_human']);

  return {
    activeConversations: activeConversations || 0,
    reputationScore: reputationScoreValue,
    reputationIndicator,
    needsAttention: attentionCount || 0,
  };
}

export default async function Page() {
  const { company_id } = await getCompanyContext();
  const kpiData = await getKpiData(company_id);

  return (
    <div className="p-6 space-y-6 h-full">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Active Conversations"
          value={kpiData.activeConversations}
          icon={MessageSquare}
          color="#10b981"
        />
        <KpiCard
          title="Reputation Score"
          value={kpiData.reputationIndicator}
          icon={Heart}
          color="#f43f5e"
        />
        <KpiCard
          title="Needs Attention"
          value={kpiData.needsAttention}
          icon={AlertTriangle}
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
        <ReviewsTrendChart companyId={company_id} />

        <Card className="gap-0 py-0">
          <CriticalUpdates companyId={company_id} />
        </Card>
      </div>
    </div>
  );
}