/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { LucideIcon, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProgramCardProps {
  id?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  iconBorderColor: string;
  title: string;
  description: string;
  participantCount: string;
  rewardText?: string;
  status: 'live' | 'paused' | 'draft';
}

export function ProgramCard({
  id = 'summer-special',
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description,
  participantCount,
  rewardText = 'Referral Reward',
  status: initialStatus,
}: ProgramCardProps) {
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(initialStatus);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    const newStatus = status === 'live' ? 'paused' : 'active';
    
    try {
      const { error } = await (supabase
        .from('referral_program') as any)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setStatus(newStatus === 'active' ? 'live' : 'paused');
      toast.success(`Program ${newStatus === 'active' ? 'activated' : 'paused'}`);
      queryClient.invalidateQueries({ queryKey: ['referral-programs'] });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update program status');
    } finally {
      setIsToggling(false);
    }
  };
  return (
    <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1919] overflow-hidden group hover:border-primary/30 transition-all flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              iconBgColor
            )}
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          {status === 'live' && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#10221c] border border-primary/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#69f6b8]" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-widest">Live</span>
            </div>
          )}
          {status === 'paused' && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#262626] border border-[#484847]/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#777575]" />
              <span className="text-[#777575] text-[10px] font-bold uppercase tracking-widest">Paused</span>
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-8">
          <h4 className="text-xl font-extrabold tracking-tight text-white mb-1">{title}</h4>
          <p className="text-muted-foreground/60 text-xs uppercase tracking-wider">{description}</p>
        </div>

        {/* Stats Table */}
        <div className="space-y-px bg-[#1a1919] border border-[#1a1919] rounded-lg overflow-hidden mb-8">
          <div className="bg-[#0e0e0e] p-3 flex justify-between items-center">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Reward Protocol</span>
            <span className="text-xs font-bold text-white">{rewardText}</span>
          </div>
          <div className="bg-[#0e0e0e] p-3 flex justify-between items-center">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Participants</span>
            <span className="text-xs font-bold text-primary">{participantCount} Total</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Link href={`/referral-programs/${id}`} className="flex-1">
            <button className="w-full py-3 bg-primary text-[#002919] rounded-lg font-extrabold text-sm hover:shadow-[0_0_15px_rgba(105,246,184,0.3)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              MANAGE
            </button>
          </Link>
          <button 
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={cn(
              "w-12 h-12 flex items-center justify-center border border-[#1a1919] rounded-lg transition-all disabled:opacity-50",
              status === 'live' 
                ? "text-muted-foreground hover:text-white hover:bg-[#1a1919]" 
                : "text-primary hover:bg-primary/10"
            )}
          >
            {status === 'live' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
