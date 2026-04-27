'use client';

interface RewardConfigCardProps {
  referrerReward: string;
  referrerRewardType: string;
  referredBonus: string;
  referredBonusType: string;
  totalPaid: string;
  progressPercentage?: number;
}

export function RewardConfigCard({
  referrerReward = '$50',
  referrerRewardType = 'Credit',
  referredBonus = '15%',
  referredBonusType = 'Commission',
  totalPaid = '$24,100.00',
  progressPercentage = 66,
}: RewardConfigCardProps) {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 md:p-6 overflow-hidden relative flex-1 w-full">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 relative z-10 w-full">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary whitespace-nowrap">
          Rewards
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest whitespace-nowrap">
              Referrer
            </p>
            <p className="text-lg md:text-xl font-extrabold text-foreground whitespace-nowrap">
              {referrerReward}{' '}
              <span className="text-sm font-medium text-muted-foreground">{referrerRewardType}</span>
            </p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-primary/20" />
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest whitespace-nowrap">
              Referred
            </p>
            <p className="text-lg md:text-xl font-extrabold text-foreground whitespace-nowrap">
              {referredBonus}{' '}
              <span className="text-sm font-medium text-muted-foreground">{referredBonusType}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
