'use client';

import { BarChart3, ShieldCheck, Bot, Users } from 'lucide-react';
import { useProgramWizard } from '@/lib/program-wizard-context';

interface ReviewContextGridProps {
  clientCount?: number;
}

export function ReviewContextGrid({ clientCount }: ReviewContextGridProps) {
  const { data } = useProgramWizard();
  const count = clientCount ?? data.clientCount;
  
  const formatCount = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="mt-24">
      <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        Review & Context
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Potential Referral Network */}
        <div className="bg-[#1a1919] p-6 rounded-2xl md:col-span-2">
          <p className="text-[10px] font-bold text-muted-foreground mb-4">POTENTIAL REFERRAL NETWORK</p>
          <div className="flex items-end gap-2">
            <Users className="w-8 h-8 text-primary mr-2" />
            <span className="text-4xl font-black text-foreground tracking-tighter">{formatCount(count)}</span>
            <span className="text-xs text-primary mb-1">Clients</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min((count / 1000) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Risk Profile */}
        <div className="bg-[#131313] p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground mb-4">RISK PROFILE</p>
          <div className="flex flex-col items-center justify-center py-2">
            <ShieldCheck className="w-8 h-8 text-[#58e7ab]" />
            <span className="text-xs font-bold mt-2">Low Fraud Risk</span>
          </div>
        </div>

        {/* Automation */}
        <div className="bg-[#131313] p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground mb-4">AUTOMATION</p>
          <div className="flex flex-col items-center justify-center py-2">
            <Bot className="w-8 h-8 text-secondary" />
            <span className="text-xs font-bold mt-2">Sentinel Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
