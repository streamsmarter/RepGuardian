'use client';

import { Send, Mail, MousePointerClick, UserPlus, Star, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelStep {
  icon: React.ReactNode;
  value: string;
  label: string;
  isHighlight?: boolean;
  progressWidth: string;
}

const funnelSteps: FunnelStep[] = [
  { icon: <Send className="w-5 h-5 text-primary" />, value: '12.4k', label: 'Sent', progressWidth: 'w-3/4' },
  { icon: <Mail className="w-5 h-5 text-primary" />, value: '8.2k', label: 'Opened', progressWidth: 'w-2/3' },
  { icon: <MousePointerClick className="w-5 h-5 text-primary" />, value: '4.1k', label: 'Claimed', progressWidth: 'w-1/2' },
  { icon: <UserPlus className="w-5 h-5 text-primary" />, value: '1.2k', label: 'Referred', progressWidth: 'w-1/3' },
  { icon: <Star className="w-6 h-6 text-[#002919]" />, value: '482', label: 'Converted', isHighlight: true, progressWidth: '' },
];

export function ConversionFunnel() {
  return (
    <div className="col-span-12 lg:col-span-8 bg-[#1a1919] rounded-xl p-8 overflow-hidden relative group">
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Filter className="w-24 h-24" />
      </div>

      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
        Conversion Funnel
      </h3>

      <div className="flex items-center justify-between relative">
        {funnelSteps.map((step, index) => (
          <div key={index} className="contents">
            {/* Step */}
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

            {/* Connector Line (except after last step) */}
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
