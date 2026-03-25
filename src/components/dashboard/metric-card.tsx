/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { LucideIcon, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  footerIcon?: LucideIcon;
  footerText: string;
  footerColor?: string;
  valueColor?: string;
}

export function MetricCard({
  label,
  value,
  footerIcon: FooterIcon = TrendingUp,
  footerText,
  footerColor = 'text-primary',
  valueColor = 'text-white',
}: MetricCardProps) {
  return (
    <div className="col-span-3 bg-[#1a1919] p-6 rounded-xl flex flex-col justify-between">
      <div>
        <span className="text-muted-foreground text-[0.6875rem] font-bold tracking-widest uppercase mb-1 block">
          {label}
        </span>
        <h2 className={cn('text-3xl font-black', valueColor)}>{value}</h2>
      </div>
      <div className={cn('mt-4 flex items-center gap-2 text-xs font-bold', footerColor)}>
        <FooterIcon className="w-4 h-4" />
        <span>{footerText}</span>
      </div>
    </div>
  );
}

interface ConversionMetricCardProps {
  label: string;
  value: string;
  percentage: number;
}

export function ConversionMetricCard({ label, value, percentage }: ConversionMetricCardProps) {
  return (
    <div className="col-span-3 bg-[#1a1919] p-6 rounded-xl flex flex-col justify-between">
      <div>
        <span className="text-muted-foreground text-[0.6875rem] font-bold tracking-widest uppercase mb-1 block">
          {label}
        </span>
        <h2 className="text-3xl font-black text-primary">{value}</h2>
      </div>
      <div className="mt-4 w-full bg-[#201f1f] h-1 rounded-full overflow-hidden">
        <div className="bg-primary h-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface VelocityChartCardProps {
  label: string;
  value: string;
  unit: string;
}

export function VelocityChartCard({ label, value, unit }: VelocityChartCardProps) {
  return (
    <div className="col-span-3 bg-[#201f1f] p-6 rounded-xl relative overflow-hidden group">
      <div className="relative z-10">
        <span className="text-muted-foreground text-[0.6875rem] font-bold tracking-widest uppercase mb-1 block">
          {label}
        </span>
        <h2 className="text-3xl font-black text-white">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </h2>
      </div>
      {/* Abstract Chart Mock */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-1 px-4 opacity-50 group-hover:opacity-100 transition-opacity">
        <div className="bg-primary/20 w-full rounded-t-sm" style={{ height: '40%' }} />
        <div className="bg-primary/20 w-full rounded-t-sm" style={{ height: '60%' }} />
        <div className="bg-primary/40 w-full rounded-t-sm" style={{ height: '55%' }} />
        <div className="bg-primary/30 w-full rounded-t-sm" style={{ height: '80%' }} />
        <div className="bg-primary/50 w-full rounded-t-sm" style={{ height: '90%' }} />
        <div className="bg-primary w-full rounded-t-sm" style={{ height: '100%' }} />
      </div>
    </div>
  );
}
