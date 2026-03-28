/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Pause, Pencil, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel';
import { RewardConfigCard } from '@/components/dashboard/reward-config-card';
import { ChannelPerformanceChart } from '@/components/dashboard/channel-performance-chart';
import { FinancialImpactCard } from '@/components/dashboard/financial-impact-card';
import { ParticipantTable } from '@/components/dashboard/participant-table';
import { createBrowserComponentClient } from '@/lib/supabase/client';

interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  company_id: string;
  referrer_reward_amount: number | null;
  referred_reward_amount: number | null;
  referrer_reward_type: string | null;
  referred_reward_type: string | null;
}

interface Campaign {
  id: string;
  name: string | null;
  status: string | null;
  type: string | null;
  total_sends_count: number | null;
  clicks_count: number | null;
  submissions_count: number | null;
  clients_count: number | null;
  conversion_rate: number | null;
  click_through_rate: number | null;
  referral_program: string | null;
  rewards_expenses: number | null;
  revenue_generated: number | null;
}

interface FunnelStats {
  sent: number;
  clicks: number;
  submissions: number;
  clients: number;
}

export default function ReferralPage() {
  const supabase = createBrowserComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get company ID for current user
  useEffect(() => {
    const getCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: appUser } = await supabase
          .from('app_user')
          .select('company_id')
          .eq('user_id', user.id)
          .single() as { data: { company_id: string } | null };
        if (appUser?.company_id) {
          setCompanyId(appUser.company_id);
        }
      }
    };
    getCompanyId();
  }, [supabase]);

  // Fetch active referral program for this company
  const { data: program } = useQuery({
    queryKey: ['referral-program', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await (supabase.from('referral_program') as any)
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching referral program:', error);
        return null;
      }
      return data as ReferralProgram;
    },
    enabled: !!companyId,
  });

  // Fetch campaign data with stats (active or paused)
  const { data: campaign } = useQuery({
    queryKey: ['campaign-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await (supabase.from('campaign') as any)
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['active', 'paused'])
        .eq('type', 'referral')
        .maybeSingle();

      if (error) {
        console.error('Error fetching campaign:', error.message, error.code, error.details);
        return null;
      }

      return data as Campaign;
    },
    enabled: !!companyId,
  });

  // Mutation to toggle campaign status
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: 'active' | 'paused') => {
      if (!campaign?.id) throw new Error('No campaign ID');
      
      const { error } = await (supabase.from('campaign') as any)
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', companyId] });
    },
  });

  const handleToggleStatus = () => {
    const newStatus = campaign?.status === 'active' ? 'paused' : 'active';
    toggleStatusMutation.mutate(newStatus);
  };

  const handleEdit = () => {
    router.push('/edit-referral');
  };

  // Compute funnel stats from campaign data
  const funnelStats: FunnelStats | null = campaign ? {
    sent: campaign.total_sends_count || 0,
    clicks: campaign.clicks_count || 0,
    submissions: campaign.submissions_count || 0,
    clients: campaign.clients_count || 0,
  } : null;

  // Format reward amount based on type
  const formatRewardAmount = (amountValue: number | null | undefined, type: string | null | undefined): string => {
    if (amountValue === null || amountValue === undefined) return 'N/A';
    const amount = parseFloat(amountValue.toString());
    if (type === 'discount_percentage') {
      return `${amount}%`;
    }
    return `$${amount}`;
  };

  // Format reward type for display
  const formatRewardType = (type: string | null | undefined): string => {
    if (!type) return 'Reward';
    switch (type) {
      case 'discount_percentage':
        return 'Off';
      case 'discount_fixed':
        return 'Credit';
      case 'cash':
        return 'Cash';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };


  return (
    <div className="px-8 py-8">
          {/* Header Section */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">
                Referral Program
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleToggleStatus}
                disabled={toggleStatusMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#201f1f] hover:bg-primary/10 hover:text-primary text-foreground text-sm font-semibold transition-colors"
              >
                {campaign?.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#201f1f] hover:bg-primary/10 hover:text-primary text-foreground text-sm font-semibold transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Row 1: Conversion Funnel + Reward Config (stacked) | Financial Impact */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <ConversionFunnel stats={funnelStats || undefined} />
              <RewardConfigCard
                referrerReward={formatRewardAmount(program?.referrer_reward_amount, program?.referrer_reward_type)}
                referrerRewardType={formatRewardType(program?.referrer_reward_type)}
                referredBonus={formatRewardAmount(program?.referred_reward_amount, program?.referred_reward_type)}
                referredBonusType={formatRewardType(program?.referred_reward_type)}
                totalPaid="$0.00"
                progressPercentage={0}
              />
            </div>
            <FinancialImpactCard
              rewardsDisbursed={campaign?.rewards_expenses || 0}
              revenueGenerated={campaign?.revenue_generated || 0}
            />

            {/* Row 2: Channel Performance Chart */}
            <ChannelPerformanceChart 
              clicksCount={campaign?.clicks_count || 0}
              conversionsCount={campaign?.clients_count || 0}
            />

            {/* Row 3: Participant Table */}
            <ParticipantTable campaignId={campaign?.id} />
          </div>
    </div>
  );
}
