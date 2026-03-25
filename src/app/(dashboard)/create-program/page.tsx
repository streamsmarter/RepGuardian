'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Tag, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RewardPreviewCard } from '@/components/dashboard/reward-preview-card';
import {
  SentinelInsightCard,
  LiveInvitePreview,
  HelpResources,
} from '@/components/dashboard/sentinel-insight-card';
import { ReviewContextGrid } from '@/components/dashboard/review-context-grid';
import { useProgramWizard, ProgramType } from '@/lib/program-wizard-context';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const programTypes: { value: ProgramType; label: string; available: boolean }[] = [
  { value: 'referral', label: 'Referral', available: true },
  { value: 'reactivation', label: 'Reactivation', available: false },
  { value: 'upsells', label: 'Upsells', available: false },
  { value: 'promo', label: 'Promo', available: false },
  { value: 'loyalty', label: 'Loyalty', available: false },
];

export default function CreateProgramPage() {
  const router = useRouter();
  const { data, updateIdentity, setClientCount, isStepValid } = useProgramWizard();
  const supabase = createBrowserComponentClient();

  // Fetch client count for the current company
  const { data: clientCountData } = useQuery({
    queryKey: ['client-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('company_id')
        .eq('user_id', user.id)
        .single() as { data: { company_id: string } | null };

      if (!appUser?.company_id) return 0;

      const { count } = await supabase
        .from('client')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', appUser.company_id as string);

      return count || 0;
    },
  });

  useEffect(() => {
    if (clientCountData !== undefined) {
      setClientCount(clientCountData);
    }
  }, [clientCountData, setClientCount]);

  const handleNext = () => {
    if (!data.identity.name.trim()) {
      toast.error('Please enter a program name');
      return;
    }
    if (data.identity.programType !== 'referral') {
      toast.error('Only Referral programs are available at this time');
      return;
    }
    router.push('/create-program/rewards');
  };

  const handleProgramTypeChange = (value: string) => {
    const selectedType = programTypes.find(t => t.value === value);
    if (selectedType && !selectedType.available) {
      toast.info(`${selectedType.label} programs coming soon!`);
      return;
    }
    updateIdentity({ programType: value as ProgramType });
  };

  return (
    <div className="px-12 py-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary text-[11px] font-bold tracking-wider uppercase">
              Step 1 of 4
            </span>
            <div className="h-px flex-1 bg-[#201f1f] max-w-[100px]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Program <span className="text-secondary">Identity</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Define the core parameters of your referral program for internal and external tracking.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Section */}
          <section className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              {/* Program Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
                  Program Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Q4 Growth Catalyst"
                  value={data.identity.name}
                  onChange={(e) => updateIdentity({ name: e.target.value })}
                  className="w-full bg-black border-none rounded-lg p-4 h-auto focus-visible:ring-1 focus-visible:ring-primary focus:bg-[#1a1919] transition-all text-foreground placeholder:text-[#777575]/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
                  Description
                </label>
                <Textarea
                  placeholder="Briefly describe the objective of this referral flow..."
                  rows={4}
                  value={data.identity.description}
                  onChange={(e) => updateIdentity({ description: e.target.value })}
                  className="w-full bg-black border-none rounded-lg p-4 focus-visible:ring-1 focus-visible:ring-primary focus:bg-[#1a1919] transition-all text-foreground placeholder:text-[#777575]/50 resize-none"
                />
              </div>

              {/* Internal Label */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
                  Internal Label
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. Q4-2024-GROWTH"
                    value={data.identity.internalLabel}
                    onChange={(e) => updateIdentity({ internalLabel: e.target.value })}
                    className="w-full bg-black border-none rounded-lg p-4 pl-10 h-auto focus-visible:ring-1 focus-visible:ring-primary focus:bg-[#1a1919] transition-all text-foreground placeholder:text-[#777575]/50"
                  />
                </div>
              </div>

              {/* Two Column Inputs */}
              {/* Program Type Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
                  Program Type
                </label>
                <Select 
                  value={data.identity.programType} 
                  onValueChange={handleProgramTypeChange}
                >
                  <SelectTrigger className="w-full bg-black border-none rounded-lg p-4 h-auto focus:ring-1 focus:ring-primary focus:bg-[#1a1919] transition-all text-foreground">
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1919] border-[#484847]">
                    {programTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        disabled={!type.available}
                        className={!type.available ? 'opacity-50' : ''}
                      >
                        <span className="flex items-center gap-2">
                          {type.label}
                          {!type.available && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {data.identity.programType !== 'referral' && (
                  <p className="text-xs text-amber-500">Only Referral programs are available at this time</p>
                )}
              </div>
            </div>

            {/* Reward Preview */}
            <RewardPreviewCard
              referrerAmount={data.rewards.referrerRewardType === 'percentage' ? `${data.rewards.referrerAmount}%` : `$${data.rewards.referrerAmount.toFixed(2)}`}
              referrerType={data.rewards.referrerRewardType === 'cash' ? 'Cash Credit' : data.rewards.referrerRewardType === 'credit' ? 'Store Credit' : data.rewards.referrerRewardType === 'percentage' ? 'Discount' : 'Free Service'}
              referredAmount={data.rewards.referredRewardType === 'percentage' ? `${data.rewards.referredAmount}%` : `$${data.rewards.referredAmount.toFixed(2)}`}
              referredType={data.rewards.referredRewardType === 'cash' ? 'Cash Credit' : data.rewards.referredRewardType === 'credit' ? 'Store Credit' : data.rewards.referredRewardType === 'percentage' ? 'Discount' : 'Free Service'}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8">
              <Link href="/referral-programs">
                <Button
                  variant="ghost"
                  className="bg-[#262626] text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Programs
                </Button>
              </Link>
              <Button 
                onClick={handleNext}
                disabled={!data.identity.name.trim() || data.identity.programType !== 'referral'}
                className="bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] px-8 py-4 rounded-lg font-extrabold uppercase tracking-widest text-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Rewards
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </section>

          {/* Sidebar Context/Info */}
          <aside className="lg:col-span-4 space-y-6">
            <SentinelInsightCard />
            <LiveInvitePreview />
            <HelpResources />
          </aside>
        </div>

        {/* Summary Bento Grid */}
        <ReviewContextGrid />
    </div>
  );
}
