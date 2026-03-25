'use client';

import { Pencil, CreditCard, Gift } from 'lucide-react';
import { useProgramWizard } from '@/lib/program-wizard-context';
import Link from 'next/link';

interface ReviewCardProps {
  title: string;
  children: React.ReactNode;
}

function ReviewCard({ title, children }: ReviewCardProps) {
  return (
    <div className="bg-[#1a1919] rounded-xl p-6 transition-all hover:bg-[#201f1f] group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function IdentityCard() {
  const { data } = useProgramWizard();
  
  return (
    <div className="bg-[#1a1919] rounded-xl p-6 transition-all hover:bg-[#201f1f] group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-bold text-foreground">Identity</h3>
        <Link href="/create-program" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase">
            Program Name
          </p>
          <p className="text-foreground font-medium">{data.identity.name || 'Not set'}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase">Program Type</p>
          <p className="text-foreground font-medium capitalize">{data.identity.programType}</p>
        </div>
        {data.identity.internalLabel && (
          <div>
            <p className="text-[11px] text-muted-foreground tracking-wider uppercase">Internal Label</p>
            <p className="text-foreground font-medium text-sm">{data.identity.internalLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const rewardTypeLabels: Record<string, string> = {
  'cash': 'Cash Credit',
  'credit': 'Store Credit',
  'percentage': 'Percentage Off',
  'free_service': 'Free Service',
};

export function RewardsCard() {
  const { data } = useProgramWizard();
  
  const formatRewardDisplay = (type: string, amount: number, minSpend: number) => {
    const typeLabel = rewardTypeLabels[type] || type;
    const amountStr = type === 'percentage' ? `${amount}%` : `$${amount.toFixed(2)}`;
    const minSpendStr = minSpend > 0 ? ` (min $${minSpend.toFixed(2)} spend)` : '';
    return `${amountStr} ${typeLabel}${minSpendStr}`;
  };

  const referrerDisplay = formatRewardDisplay(
    data.rewards.referrerRewardType,
    data.rewards.referrerAmount,
    data.rewards.referrerMinSpend
  );
  const referredDisplay = formatRewardDisplay(
    data.rewards.referredRewardType,
    data.rewards.referredAmount,
    data.rewards.referredMinSpend
  );
  
  return (
    <div className="bg-[#1a1919] rounded-xl p-6 transition-all hover:bg-[#201f1f] group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-bold text-foreground">Rewards</h3>
        <Link href="/create-program/rewards" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-black rounded-lg">
          <CreditCard className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Referrer</p>
            <p className="text-foreground font-bold text-sm">{referrerDisplay}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-black rounded-lg">
          <Gift className="w-5 h-5 text-secondary" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase">Referee</p>
            <p className="text-foreground font-bold text-sm">{referredDisplay}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const segmentLabels: Record<string, string> = {
  'recent': 'Recent Customers',
  'high-spenders': 'High Spenders',
  'repeat-buyers': 'Repeat Buyers',
};

export function AudienceTargetingCard() {
  const { data } = useProgramWizard();
  
  return (
    <div className="bg-[#1a1919] rounded-xl p-8 transition-all hover:bg-[#201f1f] group">
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-sm font-bold text-foreground">Audience Targeting</h3>
        <Link href="/create-program/audience" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase mb-3">
            Segments
          </p>
          <div className="flex flex-wrap gap-2">
            {data.audience.segments.length > 0 ? (
              data.audience.segments.map((segment) => (
                <span key={segment} className="px-2 py-1 bg-[#262626] text-foreground text-[10px] font-bold rounded-full border border-[#484847]/20 uppercase">
                  {segmentLabels[segment] || segment}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No segments selected</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase mb-3">
            Safety Filter
          </p>
          <p className="text-foreground font-medium text-sm">
            {data.audience.positiveFeedbackOnly ? 'Positive feedback only' : 'All customers'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase mb-3">
            Potential Network
          </p>
          <p className="text-foreground font-medium text-sm">{data.clientCount} clients</p>
        </div>
      </div>
    </div>
  );
}
