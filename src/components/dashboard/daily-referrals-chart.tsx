'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const chartBars = [
  { height: 'h-3/4', highlight: false },
  { height: 'h-2/3', highlight: false },
  { height: 'h-1/2', highlight: false },
  { height: 'h-4/5', highlight: true },
  { height: 'h-3/5', highlight: false },
  { height: 'h-2/3', highlight: false },
  { height: 'h-full', highlight: true },
  { height: 'h-4/5', highlight: false },
  { height: 'h-3/4', highlight: false },
  { height: 'h-2/3', highlight: false },
  { height: 'h-1/2', highlight: false },
  { height: 'h-4/5', highlight: true },
  { height: 'h-3/5', highlight: false },
  { height: 'h-2/3', highlight: false },
];

export function DailyReferralsChart() {
  return (
    <div className="col-span-12 lg:col-span-9 bg-[#1a1919] rounded-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Daily Referrals
          </h3>
          <p className="text-lg font-bold">Growth Trends</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
            <TrendingUp className="w-3 h-3" />
            +12.4%
          </span>
          <div className="flex bg-[#262626] rounded p-1">
            <button className="px-3 py-1 text-[10px] font-bold rounded bg-[#131313] text-foreground">
              1D
            </button>
            <button className="px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
              7D
            </button>
            <button className="px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
              30D
            </button>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="h-64 flex items-end gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        {chartBars.map((bar, index) => (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-t-sm transition-colors group relative',
              bar.height,
              bar.highlight
                ? 'bg-primary/40 hover:bg-primary/60'
                : 'bg-[#201f1f] hover:bg-primary/20'
            )}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#262626] px-2 py-1 rounded text-[10px] font-bold border border-[#484847]/20">
              {Math.floor(Math.random() * 50) + 20}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
