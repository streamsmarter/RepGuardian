'use client';

import { Wallet, TrendingUp, CreditCard } from 'lucide-react';

interface FinancialImpactCardProps {
  rewardsDisbursed?: number;
  revenueGenerated?: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const calculateROI = (revenue: number, expenses: number): { ratio: string; isPositive: boolean } => {
  if (expenses === 0) {
    return { ratio: revenue > 0 ? 'INF' : '0x', isPositive: revenue > 0 };
  }
  const roi = revenue / expenses;
  return {
    ratio: `${roi.toFixed(1)}x`,
    isPositive: roi >= 1,
  };
};

export function FinancialImpactCard({
  rewardsDisbursed = 0,
  revenueGenerated = 0,
}: FinancialImpactCardProps) {
  const { ratio: roiRatio, isPositive } = calculateROI(revenueGenerated, rewardsDisbursed);
  return (
    <div className="col-span-12 lg:col-span-4 bg-[#1a1919] rounded-xl p-8 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">Financial Impact</h3>
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue Generated</p>
            </div>
            <p className="text-2xl font-black text-foreground">{formatCurrency(revenueGenerated)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[#8596ff]" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rewards Disbursed</p>
            </div>
            <p className="text-2xl font-black text-foreground">{formatCurrency(rewardsDisbursed)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1 relative z-10">ROI Ratio</p>
        <p className="text-4xl font-black text-primary relative z-10">{roiRatio}</p>
        {isPositive && revenueGenerated > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-primary relative z-10">
            <TrendingUp className="w-3 h-3" />
            <span>Profitable</span>
          </div>
        )}
      </div>
    </div>
  );
}
