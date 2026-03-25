'use client';

import { Pause, Pencil, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel';
import { RewardConfigCard } from '@/components/dashboard/reward-config-card';
import { DailyReferralsChart } from '@/components/dashboard/daily-referrals-chart';
import { RecentWinsFeed } from '@/components/dashboard/recent-wins-feed';
import { ParticipantTable } from '@/components/dashboard/participant-table';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return (
    <div className="px-8 py-8">
          {/* Header Section */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                  Active
                </span>
                <span className="text-muted-foreground text-xs uppercase tracking-widest">
                  Campaign ID: SS-2024-001
                </span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">
                Summer Special
              </h2>
              <p className="text-muted-foreground mt-1">
                High-intent referral cycle targeting existing power users.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#201f1f] hover:bg-[#262626] text-foreground text-sm font-semibold transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#201f1f] hover:bg-[#262626] text-foreground text-sm font-semibold transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#201f1f] hover:bg-[#262626] text-foreground text-sm font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Funnel Visual (Large Card) */}
            <ConversionFunnel />

            {/* Reward Config Summary (Side Card) */}
            <RewardConfigCard
              referrerReward="$50"
              referrerRewardType="Credit"
              referredBonus="15%"
              referredBonusType="Commission"
              totalPaid="$24,100.00"
              progressPercentage={66}
            />

            {/* Performance Chart (Large Card) */}
            <DailyReferralsChart />

            {/* Activity Feed (Narrow Card) */}
            <RecentWinsFeed />

            {/* Participant Table Section */}
            <ParticipantTable />
          </div>
    </div>
  );
}
