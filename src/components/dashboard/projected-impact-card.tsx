/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Rocket, ShieldCheck, Loader2 } from 'lucide-react';
import { useProgramWizard } from '@/lib/program-wizard-context';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function ProjectedImpactCard() {
  const { data } = useProgramWizard();
  
  const formatCount = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };
  
  const estimatedConversion = 4.2;
  const estimatedReferrals = Math.round(data.clientCount * (estimatedConversion / 100));
  
  return (
    <div className="bg-[#262626]/40 backdrop-blur-xl border border-primary/10 rounded-xl p-8 relative overflow-hidden group">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full" />

      <div className="flex items-center space-x-2 mb-8">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground tracking-tight">Projected Impact</h3>
      </div>

      <div className="space-y-10">
        {/* Est. Reach */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Potential Network
            </p>
            <span className="text-2xl font-bold text-primary">{formatCount(data.clientCount)}</span>
          </div>
          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(105,246,184,0.4)]" style={{ width: `${Math.min((data.clientCount / 1000) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Conv. Rate */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Conv. Rate
            </p>
            <span className="text-2xl font-bold text-secondary">4.2%</span>
          </div>
          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-[42%] rounded-full shadow-[0_0_8px_rgba(133,150,255,0.4)]" />
          </div>
        </div>

        {/* Sentiment Engine Prediction */}
        <div className="pt-6 border-t border-[#484847]/15">
          <p className="text-[11px] text-muted-foreground uppercase mb-4">
            Sentiment Engine Prediction
          </p>
          <div className="p-4 bg-black/50 rounded-lg text-xs leading-relaxed text-muted-foreground italic">
            &quot;Campaign structure aligns with current power-user behavior. Probability of achieving
            500+ referrals in month 1 is{' '}
            <span className="text-primary font-bold">High (84%)</span>.&quot;
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeployButton() {
  const router = useRouter();
  const { data, resetWizard, isStepValid } = useProgramWizard();
  const [isDeploying, setIsDeploying] = useState(false);
  const supabase = createBrowserComponentClient();

  const handleDeploy = async () => {
    if (!isStepValid(4)) {
      toast.error('Please complete all steps before deploying');
      return;
    }

    setIsDeploying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to deploy a program');
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

      // Map frontend reward types to valid database types
      // Valid types: 'points', 'discount_percentage', 'discount_fixed', 'free_service', 'free_item'
      const mapRewardType = (type: string): string => {
        switch (type) {
          case 'cash':
          case 'credit':
            return 'discount_fixed';
          case 'percentage':
            return 'discount_percentage';
          case 'free_service':
            return 'free_service';
          default:
            return 'discount_fixed';
        }
      };

      const referrerDbType = mapRewardType(data.rewards.referrerRewardType);
      const referredDbType = mapRewardType(data.rewards.referredRewardType);

      // Check if referrer reward exists by company_id, amount, type, status=active
      const { data: existingReferrerRewards } = await (supabase
        .from('reward') as any)
        .select('id')
        .eq('company_id', companyId)
        .eq('amount', data.rewards.referrerAmount)
        .eq('type', referrerDbType)
        .eq('status', 'active')
        .limit(1);

      let referrerRewardId: string;
      if (existingReferrerRewards && existingReferrerRewards.length > 0) {
        referrerRewardId = existingReferrerRewards[0].id;
      } else {
        // Create new referrer reward
        const { data: newReferrerReward, error: referrerError } = await (supabase
          .from('reward') as any)
          .insert({
            company_id: companyId,
            name: `${data.identity.name} - Referrer Reward`,
            type: referrerDbType,
            amount: data.rewards.referrerAmount,
            status: 'active',
            metadata: { minSpend: data.rewards.referrerMinSpend },
            reward_reason: 'referral',
          })
          .select('id')
          .single();

        if (referrerError) throw referrerError;
        referrerRewardId = newReferrerReward.id;
      }

      // Check if referred reward exists by company_id, amount, type, status=active
      const { data: existingReferredRewards } = await (supabase
        .from('reward') as any)
        .select('id')
        .eq('company_id', companyId)
        .eq('amount', data.rewards.referredAmount)
        .eq('type', referredDbType)
        .eq('status', 'active')
        .limit(1);

      let referredRewardId: string;
      if (existingReferredRewards && existingReferredRewards.length > 0) {
        referredRewardId = existingReferredRewards[0].id;
      } else {
        // Create new referred reward
        const { data: newReferredReward, error: referredError } = await (supabase
          .from('reward') as any)
          .insert({
            company_id: companyId,
            name: `${data.identity.name} - Referred Reward`,
            type: referredDbType,
            amount: data.rewards.referredAmount,
            status: 'active',
            metadata: { minSpend: data.rewards.referredMinSpend },
            reward_reason: 'referral',
          })
          .select('id')
          .single();

        if (referredError) throw referredError;
        referredRewardId = newReferredReward.id;
      }

      // Send all data to n8n webhook with reward IDs
      const payload = {
        company_id: companyId,
        user_id: user.id,
        identity: {
          name: data.identity.name,
          description: data.identity.description,
          internalLabel: data.identity.internalLabel,
          programType: data.identity.programType,
        },
        rewards: {
          referrer: {
            id: referrerRewardId,
            type: referrerDbType,
            amount: data.rewards.referrerAmount,
            minSpend: data.rewards.referrerMinSpend,
          },
          referred: {
            id: referredRewardId,
            type: referredDbType,
            amount: data.rewards.referredAmount,
            minSpend: data.rewards.referredMinSpend,
          },
        },
        audience: {
          segments: data.audience.segments,
          positiveFeedbackOnly: data.audience.positiveFeedbackOnly,
        },
        clientCount: data.clientCount,
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

      toast.success('Program deployed successfully!');
      resetWizard();
      router.push('/referral-programs');
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast.error(error.message || 'Failed to deploy program');
    } finally {
      setIsDeploying(false);
    }
  };

  const isValid = isStepValid(4);

  return (
    <div className="space-y-4">
      <button 
        onClick={handleDeploy}
        disabled={isDeploying || !isValid}
        className="bg-gradient-to-br from-primary to-[#06b77f] w-full py-5 rounded-lg flex items-center justify-center space-x-3 text-[#002919] font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:opacity-80 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Deploying...</span>
          </>
        ) : (
          <>
            <span>Deploy Program</span>
            <Rocket className="w-5 h-5" />
          </>
        )}
      </button>
      <p className="text-center text-[10px] text-muted-foreground/60 px-4">
        By deploying, your campaign will go live immediately to the selected audience segments.
      </p>
    </div>
  );
}

export function ConfigurationStatus() {
  return (
    <div className="p-4 rounded-lg bg-[#131313] flex items-start space-x-3">
      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
      <div>
        <p className="text-[11px] font-bold text-foreground">Configuration Valid</p>
        <p className="text-[10px] text-muted-foreground">
          No conflicts detected in reward logic or audience filters.
        </p>
      </div>
    </div>
  );
}
