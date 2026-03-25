import { Button } from '@/components/ui/button';
import { HeroScoreCard } from '@/components/dashboard/hero-score-card';
import { ReviewsTrendCard } from '@/components/dashboard/reviews-trend-card';
import { StatCard, AutopilotCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';

export const dynamic = 'force-dynamic';

type CompanyReputation = {
  reputation_score?: {
    company_reputation_score?: number;
  };
};

async function getCommandCenterData(companyId: string) {
  const supabase = await createServerComponentClient();

  // Active Conversations - count of chats for this company
  const { count: activeConversations } = await supabase
    .from('chat')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  // Reputation Score - from company's reputation_score object
  const { data: companyData } = await supabase
    .from('company')
    .select('reputation_score')
    .eq('id', companyId)
    .single();

  const reputationScoreValue =
    (companyData as CompanyReputation | null)?.reputation_score?.company_reputation_score || 0;

  // Convert to percentage (assuming score is 0-5, convert to 0-100)
  const reputationPercent = Math.round((reputationScoreValue / 5) * 100);

  // Needs Attention - count clients with status "conflict" or "needs_human"
  const { count: needsAttention } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['conflict', 'needs_human']);

  return {
    activeConversations: activeConversations || 0,
    reputationPercent,
    needsAttention: needsAttention || 0,
    companyId,
  };
}

export default async function CommandCenterPage() {
  const { company_id } = await getCompanyContext();
  const data = await getCommandCenterData(company_id);
  return (
    <div className="px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Hero Section: Reputation Score */}
            <HeroScoreCard reputationPercent={data.reputationPercent} />

            {/* Reviews Trend Chart */}
            <ReviewsTrendCard companyId={data.companyId} />

            {/* Quick Stats Cards */}
            <StatCard
              iconName="MessageSquare"
              iconBgColor="bg-secondary/10"
              iconColor="text-secondary"
              label="Live"
              labelColor="text-secondary"
              title="Active Conversations"
              value={data.activeConversations}
              footerIconName="TrendingUp"
              footerIconColor="text-primary"
              footerText="Currently active"
            />
            <StatCard
              iconName="AlertTriangle"
              iconBgColor="bg-destructive/10"
              iconColor="text-destructive"
              label="Urgent"
              labelColor="text-destructive"
              title="Needs Attention"
              value={data.needsAttention}
              footerIconName="Clock"
              footerIconColor="text-muted-foreground"
              footerText="Requires review"
            />

            {/* Autopilot Card */}
            <AutopilotCard
              iconName="Zap"
              title="Autopilot Active"
              description="AI is responding to positive reviews in real-time."
            />

            {/* Recent Activity Feed */}
            <ActivityFeed />
          </div>
        </div>
    </div>
  );
}
