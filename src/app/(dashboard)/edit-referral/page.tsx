/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { ArrowLeft, UserPlus, Handshake, Sparkles, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RewardTypeSelector } from '@/components/dashboard/reward-type-selector';
import { EconomicsPreview, SimulatedROI } from '@/components/dashboard/economics-preview';
import { useProgramWizard, RewardType } from '@/lib/program-wizard-context';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function EditReferralPage() {
  const router = useRouter();
  const supabase = createBrowserComponentClient();
  const { data, updateRewards } = useProgramWizard();
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="p-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2">
            Edit Referral Program
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Update the reward mechanics for your referral program. Balanced rewards drive higher
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
            href="/app/referral"
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold text-sm">Cancel</span>
          </Link>

          <Button 
            onClick={handleSave}
            disabled={isSaving || data.rewards.referrerAmount <= 0 || data.rewards.referredAmount <= 0}
            className="px-12 py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
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
