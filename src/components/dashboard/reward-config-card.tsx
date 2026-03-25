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
    <div className="col-span-12 lg:col-span-4 bg-primary/5 border border-primary/10 rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">
          Reward Configuration
        </h3>

        <div className="space-y-6">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
              Referrer Reward
            </p>
            <p className="text-3xl font-extrabold text-foreground">
              {referrerReward}{' '}
              <span className="text-lg font-medium text-muted-foreground">{referrerRewardType}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
              Referred Bonus
            </p>
            <p className="text-3xl font-extrabold text-foreground">
              {referredBonus}{' '}
              <span className="text-lg font-medium text-muted-foreground">{referredBonusType}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-primary/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total Paid to Date</span>
          <span className="text-foreground font-bold">{totalPaid}</span>
        </div>
        <div className="w-full h-1 bg-[#262626] rounded-full mt-2">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
