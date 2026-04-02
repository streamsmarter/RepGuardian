'use client';

import { Lightbulb, Clock, ShoppingCart, Verified } from 'lucide-react';
import { useProgramWizard, RewardType } from '@/lib/program-wizard-context';

function getRewardTypeLabel(type: RewardType): string {
  switch (type) {
    case 'cash':
      return 'Cash Credit';
    case 'credit':
      return 'Store Credit';
    case 'percentage':
      return 'Discount';
    case 'free_service':
      return 'Free Service';
    default:
      return 'Reward';
  }
}

function formatRewardValue(type: RewardType, amount: number): string {
  if (type === 'percentage') {
    return `${amount}%`;
  }
  return `$${amount.toFixed(2)}`;
}

export function RewardSummary() {
  const { data } = useProgramWizard();
  const { rewards } = data;

  return (
    <div className="bg-[#201f1f] p-8 rounded-lg border border-[#484847]/10 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      
      <h4 className="font-bold text-xs tracking-[0.2em] mb-8 text-muted-foreground border-b border-[#484847]/10 pb-4">
        REWARD SUMMARY
      </h4>

      <div className="space-y-10">
        {/* Referrer Summary */}
        <div className="space-y-3">
          <p className="text-[10px] text-primary tracking-widest uppercase font-bold">
            Referrer Incentive
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">
              {formatRewardValue(rewards.referrerRewardType, rewards.referrerAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {getRewardTypeLabel(rewards.referrerRewardType)}
            </span>
          </div>
          {rewards.referrerMinSpend > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-black/50 p-2 rounded">
              <Clock className="w-4 h-4" />
              <span>Unlocked after ${rewards.referrerMinSpend.toFixed(2)} spend</span>
            </div>
          )}
        </div>

        {/* Referred Summary */}
        <div className="space-y-3">
          <p className="text-[10px] text-secondary tracking-widest uppercase font-bold">
            Friend Incentive
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">
              {formatRewardValue(rewards.referredRewardType, rewards.referredAmount)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {getRewardTypeLabel(rewards.referredRewardType)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-black/50 p-2 rounded">
            <ShoppingCart className="w-4 h-4" />
            <span>Applied on first purchase</span>
          </div>
        </div>

        {/* Campaign Meta */}
        <div className="pt-6 border-t border-[#484847]/10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground font-medium">Payout Method</span>
              <span className="text-[11px] font-bold">Automated Wallet</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground font-medium">Verification</span>
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <Verified className="w-3 h-3" />
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TacticalNote() {
  return (
    <div className="bg-[#131313] p-6 rounded-lg border border-[#484847]/10">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h4 className="font-bold text-sm">Tactical Note</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Asymmetric rewards (larger referrer bonus) typically drive 2.4x more invitations in your specific niche.
      </p>
      <div className="flex items-center gap-4 py-3 border-y border-[#484847]/10">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter mb-1">Status</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold">Draft Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
