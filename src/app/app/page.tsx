export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { MessageSquare, Heart, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { CriticalUpdates } from '@/components/critical-updates';
import { GoogleReviews } from '@/components/google-reviews';

type CompanyReputation = {
  reputation_score?: {
    company_reputation_score?: number;
  };
};

async function getKpiData(companyId: string) {
  const supabase = await createServerComponentClient();

  const { count: activeConversations } = await supabase
    .from('chat')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  const { data: companyData } = await supabase
    .from('company')
    .select('reputation_score')
    .eq('id', companyId)
    .single();

  const reputationScoreValue = (companyData as CompanyReputation | null)?.reputation_score?.company_reputation_score || 0;

  const getReputationIndicator = (score: number): string => {
    if (score === 0) return 'Unknown';
    if (score < 3) return 'Terrible';
    if (score < 4) return 'Bad';
    if (score < 4.7) return 'Moderate';
    return 'Healthy';
  };

  const { count: attentionCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['conflict', 'needs_human']);

  return {
    activeConversations: activeConversations || 0,
    reputationIndicator: getReputationIndicator(reputationScoreValue),
    needsAttention: attentionCount || 0,
  };
}

export default async function DashboardPage() {
  const { company_id } = await getCompanyContext();
  const kpiData = await getKpiData(company_id);

  return (
    <div className="p-6 space-y-6 h-full">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Active Conversations" value={kpiData.activeConversations} icon={MessageSquare} color="#10b981" />
        <KpiCard title="Reputation Score" value={kpiData.reputationIndicator} icon={Heart} color="#f43f5e" />
        <KpiCard title="Needs Attention" value={kpiData.needsAttention} icon={AlertTriangle} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
        <Card>
          <GoogleReviews />
        </Card>
        <Card>
          <CriticalUpdates />
        </Card>
      </div>
    </div>
  );
}
