import { HeroScoreCard } from '@/components/dashboard/hero-score-card';
import { ReviewsTrendCard } from '@/components/dashboard/reviews-trend-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';

export const dynamic = 'force-dynamic';

type CompanyReputation = {
  created_at?: string;
  reputation_score?: {
    company_reputation_score?: number;
  };
};

type PositiveReviewRow = {
  id: string;
  stars: number | null;
  review_published_at: string | null;
};

type ReferredClientRow = {
  id: string;
  referred_by: string | null;
};

async function getCommandCenterData(companyId: string) {
  const supabase = await createServerComponentClient();

  // Reputation Score - from company's reputation_score object
  const { data: companyData } = await supabase
    .from('company')
    .select('created_at, reputation_score')
    .eq('id', companyId)
    .single();

  const companyCreatedAt = (companyData as CompanyReputation | null)?.created_at;
  const reputationScoreValue =
    (companyData as CompanyReputation | null)?.reputation_score?.company_reputation_score || 0;

  // Convert to percentage (assuming score is 0-5, convert to 0-100)
  const reputationPercent = Math.round((reputationScoreValue / 5) * 100);

  // Positive reviews collected since the company was onboarded
  let positiveReviews = 0;
  const { data: positiveReviewRowsRaw } = await supabase
    .from('review')
    .select('id, stars, review_published_at')
    .eq('company_id', companyId)
    .gte('stars', 4)
    .lte('stars', 5);

  const positiveReviewRows = (positiveReviewRowsRaw ?? []) as PositiveReviewRow[];

  if (positiveReviewRows?.length) {
    const onboardedAt = companyCreatedAt ? new Date(companyCreatedAt).getTime() : Number.NEGATIVE_INFINITY;

    positiveReviews = positiveReviewRows.filter((review) => {
      if (!review.review_published_at) return false;
      return new Date(review.review_published_at).getTime() >= onboardedAt;
    }).length;
  }

  // Clients referred - all clients with a non-empty referred_by value
  const { data: referredClientRowsRaw } = await supabase
    .from('client')
    .select('id, referred_by')
    .eq('company_id', companyId)
    .not('referred_by', 'is', null);

  const referredClientRows = (referredClientRowsRaw ?? []) as ReferredClientRow[];

  const referredClients = referredClientRows.filter((client) => {
    if (typeof client.referred_by !== 'string') return false;
    return client.referred_by.trim().length > 0;
  }).length;

  // Successful reengagement reminders
  const { count: successfulReengagements } = await supabase
    .from('reminder')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'succeeded')
    .eq('type', 'reengagement');

  return {
    positiveReviews,
    reputationPercent,
    referredClients,
    successfulReengagements: successfulReengagements || 0,
    companyId,
  };
}

export default async function CommandCenterPage() {
  const { company_id } = await getCompanyContext();
  const data = await getCommandCenterData(company_id);
  return (
    <div className="px-4 md:px-8 py-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Hero Section: Reputation Score */}
            <HeroScoreCard reputationPercent={data.reputationPercent} />

            {/* Reviews Trend Chart */}
            <ReviewsTrendCard companyId={data.companyId} />

            {/* Quick Stats Cards */}
            <StatCard
              iconName="MessageSquare"
              iconBgColor="bg-secondary/10"
              iconColor="text-secondary"
              label="Reviews"
              labelColor="text-secondary"
              title="Positive Reviews Collected"
              value={data.positiveReviews}
              footerIconName="TrendingUp"
              footerIconColor="text-primary"
              footerText="Positive reviews since onboarding"
            />
            <StatCard
              iconName="UserPlus"
              iconBgColor="bg-[#1D3F73]/20"
              iconColor="text-[#6FA8FF]"
              label="Referrals"
              labelColor="text-[#6FA8FF]"
              title="Clients Referred"
              value={data.referredClients}
              footerIconName="TrendingUp"
              footerIconColor="text-primary"
              footerText="New clients brought in through referrals"
            />

            <StatCard
              iconName="Zap"
              iconBgColor="bg-primary/10"
              iconColor="text-primary"
              label="Reengaged"
              labelColor="text-primary"
              title="Successful Reminders"
              value={data.successfulReengagements}
              footerIconName="TrendingUp"
              footerIconColor="text-primary"
              footerText="Won-back clients from reminder campaigns"
            />

            {/* Recent Activity Feed */}
            <ActivityFeed />
          </div>
        </div>
    </div>
  );
}
