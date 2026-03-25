'use client';

import { Brain, Sparkles, BookOpen } from 'lucide-react';

export function SentinelInsightCard() {
  return (
    <div className="bg-[#262626]/40 backdrop-blur-xl p-6 rounded-2xl border border-[#484847]/10 relative overflow-hidden">
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain className="w-16 h-16" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
          Sentinel Insight
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground mb-4 leading-relaxed">
        "Programs with clear reward structures and fast payout cycles consistently drive{' '}
        <strong>higher referral activation</strong> and repeat engagement."
      </p>

      {/* Status */}
      <div className="bg-black/50 p-3 rounded-lg flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">AI Optimization</span>
        <span className="text-[10px] font-bold text-primary">Active</span>
      </div>
    </div>
  );
}

export function LiveInvitePreview() {
  return (
    <div className="bg-[#1a1919] p-6 rounded-2xl border border-[#484847]/5">
      <p className="text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-widest">
        Live Invite Preview
      </p>
      <div className="bg-[#262626] p-4 rounded-xl border border-[#484847]/10">
        {/* Mock Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[#484847]/20" />
          <div className="h-2 w-24 bg-[#484847]/20 rounded" />
        </div>
        {/* Mock Content */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted-foreground/20 rounded" />
          <div className="h-3 w-4/5 bg-muted-foreground/20 rounded" />
          <div className="h-3 w-3/4 bg-primary/20 rounded" />
        </div>
        {/* Mock Button */}
        <div className="mt-4 pt-4 border-t border-[#484847]/10">
          <div className="h-8 w-full bg-[#06b77f]/20 rounded flex items-center justify-center">
            <div className="h-2 w-16 bg-primary/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpResources() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer group">
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-semibold">Best Practices Guide</span>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer group">
        <BookOpen className="w-5 h-5" />
        <span className="text-xs font-semibold">Campaign Benchmarks</span>
      </div>
    </div>
  );
}
