/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, UserPlus, Handshake, Sparkles, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RewardTypeSelector } from '@/components/dashboard/reward-type-selector';
import { RewardSummary, TacticalNote } from '@/components/dashboard/reward-summary';
import { useProgramWizard, RewardType } from '@/lib/program-wizard-context';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ReferralProgramRecord {
  company_id: string;
  referrer_reward_amount: number | null;
  referred_reward_amount: number | null;
  referrer_reward_type: string | null;
  referred_reward_type: string | null;
}

export default function EditReferralPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserComponentClient());
  const { data, updateRewards } = useProgramWizard();
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  const mapRewardType = (type: string): string => {
    switch (type) {
      case 'cash':
      case 'credit':
        return 'discount_fixed';
      case 'percentage':
        return 'discount_percentage';
      default:
        return 'discount_fixed';
    }
  };

  const mapDbRewardType = (type: string | null | undefined): RewardType => {
    switch (type) {
      case 'discount_percentage':
        return 'percentage';
      case 'discount_fixed':
      case 'cash':
        return 'cash';
      case 'credit':
        return 'credit';
      default:
        return 'cash';
    }
  };

  useEffect(() => {
    const loadCurrentProgram = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setIsHydrating(false);
          return;
        }

        const { data: appUser, error: appUserError } = await supabase
          .from('app_user')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle() as { data: { company_id: string } | null; error: unknown };

        if (appUserError || !appUser?.company_id) {
          setIsHydrating(false);
          return;
        }

        const { data: program, error: programError } = await (supabase.from('referral_program') as any)
          .select('company_id, referrer_reward_amount, referred_reward_amount, referrer_reward_type, referred_reward_type')
          .eq('company_id', appUser.company_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (programError || !program) {
          setIsHydrating(false);
          return;
        }

        const currentProgram = program as ReferralProgramRecord;

        updateRewards({
          referrerRewardType: mapDbRewardType(currentProgram.referrer_reward_type),
          referrerAmount: currentProgram.referrer_reward_amount ?? 0,
          referrerMinSpend: 0,
          referredRewardType: mapDbRewardType(currentProgram.referred_reward_type),
          referredAmount: currentProgram.referred_reward_amount ?? 0,
          referredMinSpend: 0,
        });
      } finally {
        setIsHydrating(false);
      }
    };

    loadCurrentProgram();
  }, [supabase, updateRewards]);

  const handleSave = async () => {
    if (data.rewards.referrerAmount <= 0) {
      toast.error('Please enter a valid referrer reward amount');
      return;
    }
    if (data.rewards.referredAmount <= 0) {
      toast.error('Please enter a valid referred reward amount');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save changes');
        return;
      }

      const { data: appUser } = await supabase
        .from('app_user')
        .select('company_id')
        .eq('user_id', user.id)
        .single() as { data: { company_id: string } | null };

      if (!appUser?.company_id) {
        toast.error('Company not found');
        return;
      }

      const companyId = appUser.company_id;
      const referrerDbType = mapRewardType(data.rewards.referrerRewardType);
      const referredDbType = mapRewardType(data.rewards.referredRewardType);

      // Send to webhook with only company_id, user_id, and rewards
      const payload = {
        company_id: companyId,
        user_id: user.id,
        rewards: {
          referrer: {
            type: referrerDbType,
            amount: data.rewards.referrerAmount,
          },
          referred: {
            type: referredDbType,
            amount: data.rewards.referredAmount,
          },
        },
      };

      const response = await fetch('https://apex-art.app.n8n.cloud/webhook/refpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      toast.success('Referral program updated successfully!');
      router.push('/app/referral');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getAmountLabel = (type: RewardType) => {
    switch (type) {
      case 'percentage':
        return 'Discount (%)';
      default:
        return 'Amount ($)';
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mt-2">
            Edit Referral Program
          </h1>
          <p className="text-muted-foreground mt-2 md:mt-3 max-w-2xl leading-relaxed text-sm md:text-base">
            Update the reward mechanics for your referral program. Balanced rewards drive higher
            conversion rates and long-term customer loyalty.
          </p>
        </header>

        {/* Reward Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-16">
          {/* Referrer Reward Column */}
          <section className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Referrer Reward Card */}
            <div className="bg-[#1a1919] p-4 md:p-8 rounded-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-base md:text-lg">Referrer Reward</h3>
              </div>

              {/* Selection Cards */}
              <RewardTypeSelector 
                selectedType={data.rewards.referrerRewardType}
                onSelect={(type) => updateRewards({ referrerRewardType: type })}
              />

              {/* Value Inputs */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[#484847]/10">
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
              </div>
            </div>

            {/* Referred Customer Reward Card */}
            <div className="bg-[#1a1919] p-4 md:p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Handshake className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-bold text-base md:text-lg">Referred Customer Reward</h3>
              </div>

              {/* Selection Cards */}
              <RewardTypeSelector 
                selectedType={data.rewards.referredRewardType}
                onSelect={(type) => updateRewards({ referredRewardType: type })}
              />

              {/* Value Inputs */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[#484847]/10">
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

                {/* AI Suggestion */}
                <div className="mt-4 md:mt-6 bg-[#262626]/40 backdrop-blur-xl border border-[#484847]/10 p-3 md:p-4 flex items-center gap-3 md:gap-4 rounded-lg">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary/30 flex-shrink-0" />
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
          <section className="space-y-4 md:space-y-6">
            <RewardSummary />
            <TacticalNote />
          </section>
        </div>

        {/* Navigation Actions */}
        <footer className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-[#484847]/10 pt-6 md:pt-8 mt-6 md:mt-8">
          <Link
            href="/app/referral"
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold text-sm">Cancel</span>
          </Link>

          <Button 
            onClick={handleSave}
            disabled={isSaving || isHydrating || data.rewards.referrerAmount <= 0 || data.rewards.referredAmount <= 0}
            className="w-full sm:w-auto px-8 md:px-12 py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || isHydrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isHydrating ? 'Loading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </footer>
    </div>
  );
}
