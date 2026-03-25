'use client';

import { ArrowLeft, ArrowRight, UserPlus, Handshake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RewardTypeSelector } from '@/components/dashboard/reward-type-selector';
import { EconomicsPreview, SimulatedROI } from '@/components/dashboard/economics-preview';
import { useProgramWizard, RewardType } from '@/lib/program-wizard-context';
import { toast } from 'sonner';

export default function RewardsPage() {
  const router = useRouter();
  const { data, updateRewards } = useProgramWizard();

  const handleNext = () => {
    if (data.rewards.referrerAmount <= 0) {
      toast.error('Please enter a valid referrer reward amount');
      return;
    }
    if (data.rewards.referredAmount <= 0) {
      toast.error('Please enter a valid referred reward amount');
      return;
    }
    router.push('/create-program/audience');
  };

  const getAmountLabel = (type: RewardType) => {
    switch (type) {
      case 'percentage':
        return 'Discount (%)';
      case 'free_service':
        return 'Service Value ($)';
      default:
        return 'Amount ($)';
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <span className="text-primary text-[11px] tracking-wider uppercase font-bold">
            Step 2 of 4
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2">
            Reward Mechanics
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Define the value exchange for your growth engine. Balanced rewards drive higher
            conversion rates and long-term customer loyalty.
          </p>
        </header>

        {/* Reward Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Referrer Reward Column */}
          <section className="lg:col-span-2 space-y-8">
            {/* Referrer Reward Card */}
            <div className="bg-[#1a1919] p-8 rounded-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Referrer Reward</h3>
              </div>

              {/* Selection Cards */}
              <RewardTypeSelector 
                selectedType={data.rewards.referrerRewardType}
                onSelect={(type) => updateRewards({ referrerRewardType: type })}
              />

              {/* Value Inputs */}
              <div className="mt-8 pt-8 border-t border-[#484847]/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      {getAmountLabel(data.rewards.referrerRewardType)}
                    </label>
                    <Input
                      type="number"
                      placeholder="25.00"
                      value={data.rewards.referrerAmount || ''}
                      onChange={(e) => updateRewards({ referrerAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-none text-foreground px-4 py-3 h-auto focus-visible:ring-1 focus-visible:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Minimum Spend Requirement
                    </label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={data.rewards.referrerMinSpend || ''}
                      onChange={(e) => updateRewards({ referrerMinSpend: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-none text-foreground px-4 py-3 h-auto focus-visible:ring-1 focus-visible:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Referred Customer Reward Card */}
            <div className="bg-[#1a1919] p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Handshake className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-bold text-lg">Referred Customer Reward</h3>
              </div>

              {/* Selection Cards */}
              <RewardTypeSelector 
                selectedType={data.rewards.referredRewardType}
                onSelect={(type) => updateRewards({ referredRewardType: type })}
              />

              {/* Value Inputs */}
              <div className="mt-8 pt-8 border-t border-[#484847]/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      {getAmountLabel(data.rewards.referredRewardType)}
                    </label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={data.rewards.referredAmount || ''}
                      onChange={(e) => updateRewards({ referredAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-none text-foreground px-4 py-3 h-auto focus-visible:ring-1 focus-visible:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-[11px] tracking-wider uppercase">
                      Minimum Spend Requirement
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={data.rewards.referredMinSpend || ''}
                      onChange={(e) => updateRewards({ referredMinSpend: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-none text-foreground px-4 py-3 h-auto focus-visible:ring-1 focus-visible:ring-primary transition-all"
                    />
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="mt-6 bg-[#262626]/40 backdrop-blur-xl border border-[#484847]/10 p-4 flex items-center gap-4 rounded-lg">
                  <Sparkles className="w-8 h-8 text-primary/30 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Sentinel AI suggests a{' '}
                    <span className="text-primary font-bold">20% discount</span> for this industry
                    segment to maximize day-1 conversion.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Summary / Preview Sidebar */}
          <section className="space-y-6">
            <EconomicsPreview />
            <SimulatedROI />
          </section>
        </div>

        {/* Navigation Actions */}
        <footer className="flex items-center justify-between border-t border-[#484847]/10 pt-8 mt-8">
          <Link
            href="/create-program"
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold text-sm">Back to Identity</span>
          </Link>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="px-8 py-3 bg-[#262626] border border-[#484847]/20 font-bold text-sm hover:bg-[#2c2c2c] transition-all"
            >
              Discard Changes
            </Button>
            <Button 
              onClick={handleNext}
              disabled={data.rewards.referrerAmount <= 0 || data.rewards.referredAmount <= 0}
              className="px-12 py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step: Audience
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </footer>
    </div>
  );
}
