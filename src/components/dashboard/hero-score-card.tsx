'use client';

import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HeroScoreCardProps {
  reputationPercent?: number;
}

function getStatusLabel(percent: number): { label: string; color: string } {
  if (percent >= 80) return { label: 'HEALTHY', color: 'bg-primary/10 text-primary border-primary/20' };
  if (percent >= 60) return { label: 'MODERATE', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  if (percent >= 40) return { label: 'AT RISK', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
  return { label: 'CRITICAL', color: 'bg-destructive/10 text-destructive border-destructive/20' };
}

export function HeroScoreCard({ reputationPercent = 0 }: HeroScoreCardProps) {
  const status = getStatusLabel(reputationPercent);
  const competitorPercent = Math.max(0, Math.min(99, reputationPercent - 6)); // Simulated competitor comparison

  return (
    <div className="col-span-1 md:col-span-12 lg:col-span-5 bg-[#1a1919] rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground text-[10px] tracking-[0.1em] font-bold uppercase">
            Global Reputation Score
          </span>
          <div className={`px-3 py-1 border rounded-full text-[10px] font-bold ${status.color}`}>
            {status.label}
          </div>
        </div>
        <h2 className="text-6xl md:text-8xl font-extrabold text-foreground mt-4 md:mt-6 tracking-tighter">
          {reputationPercent}<span className="text-primary text-4xl">%</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-xs leading-relaxed">
          No active reputation risks detected
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <BadgeCheck className="w-28 h-28" strokeWidth={1} />
      </div>

      <div className="mt-8 flex gap-4 relative z-10">
        <Link href="/app/reviews">
          <Button className="px-6 py-2.5 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-xs rounded-lg hover:opacity-90 transition-all">
            View Insights
          </Button>
        </Link>
      </div>
    </div>
  );
}
