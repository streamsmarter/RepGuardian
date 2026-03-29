'use client';

import { Send, Mail, MousePointerClick, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelStats {
  sent: number;
  clicks: number;
  submissions: number;
  clients: number;
}

interface ConversionFunnelProps {
  stats?: FunnelStats;
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const calculateProgressWidth = (current: number, max: number): string => {
  if (max === 0) return 'w-0';
  const percentage = (current / max) * 100;
  if (percentage >= 75) return 'w-3/4';
  if (percentage >= 66) return 'w-2/3';
  if (percentage >= 50) return 'w-1/2';
  if (percentage >= 33) return 'w-1/3';
  if (percentage >= 25) return 'w-1/4';
  return 'w-1/6';
};

export function ConversionFunnel({ stats }: ConversionFunnelProps) {
  const data: FunnelStats = stats || {
    sent: 0,
    clicks: 0,
    submissions: 0,
    clients: 0,
  };

  const funnelSteps = [
    { icon: <Send className="w-5 h-5 text-primary" />, value: formatNumber(data.sent), label: 'Sent', progressWidth: calculateProgressWidth(data.clicks, data.sent) },
    { icon: <MousePointerClick className="w-5 h-5 text-primary" />, value: formatNumber(data.clicks), label: 'Clicks', progressWidth: calculateProgressWidth(data.submissions, data.clicks) },
    { icon: <Mail className="w-5 h-5 text-primary" />, value: formatNumber(data.submissions), label: 'Submissions', progressWidth: calculateProgressWidth(data.clients, data.submissions) },
    { icon: <UserPlus className="w-6 h-6 text-[#002919]" />, value: formatNumber(data.clients), label: 'Clients', isHighlight: true, progressWidth: '' },
  ];

  return (
    <div className="bg-[#1a1919] rounded-xl p-8 overflow-hidden relative group">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
        Conversion Funnel
      </h3>

      <div className="flex items-center justify-between relative">
        {funnelSteps.map((step, index) => (
          <div key={index} className="contents">
            <div className="flex-1 flex flex-col items-center z-10">
              <div
                className={cn(
                  'flex items-center justify-center mb-4 ring-4 ring-[#0e0e0e]',
                  step.isHighlight
                    ? 'w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#06b77f] shadow-lg shadow-primary/20'
                    : 'w-16 h-16 rounded-full bg-[#262626]'
                )}
              >
                {step.icon}
              </div>
              <span
                className={cn(
                  'text-2xl font-bold',
                  step.isHighlight ? 'text-primary' : 'text-foreground'
                )}
              >
                {step.value}
              </span>
              <span
                className={cn(
                  'text-[10px] uppercase font-bold tracking-tighter',
                  step.isHighlight ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < funnelSteps.length - 1 && (
              <div className="h-0.5 flex-1 bg-[#262626] mx-2 mb-10 relative">
                <div className={cn('absolute inset-0 bg-primary/20', step.progressWidth)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
