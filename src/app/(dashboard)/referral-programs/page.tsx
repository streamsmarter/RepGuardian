'use client';

import Link from 'next/link';
import { Plus, TrendingUp, Sparkles, Award, Sun, Gift, Percent, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard, ConversionMetricCard, VelocityChartCard } from '@/components/dashboard/metric-card';
import { ProgramCard } from '@/components/dashboard/program-card';
import { ReferralActivityFeed } from '@/components/dashboard/referral-activity-feed';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const metricsData = [
  {
    label: 'Invites Sent',
    value: '12.4k',
    footerIcon: TrendingUp,
    footerText: '+12.5% vs last month',
    footerColor: 'text-primary',
  },
  {
    label: 'Rewards Claimed',
    value: '4.1k',
    footerIcon: Sparkles,
    footerText: 'Value: $20.5k',
    footerColor: 'text-secondary',
  },
];

interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

const programIcons: LucideIcon[] = [Award, Sun, Gift, Percent, Sparkles];
const programColors = [
  { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' },
  { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
];

export default function ReferralProgramsPage() {
  const supabase = createBrowserComponentClient();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['referral-programs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: appUser } = await supabase
        .from('app_user')
        .select('company_id')
        .eq('user_id', user.id)
        .single() as { data: { company_id: string } | null };

      if (!appUser?.company_id) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: programs } = await (supabase.from('referral_program') as any)
        .select('id, name, description, status, created_at')
        .eq('company_id', appUser.company_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      return (programs || []) as ReferralProgram[];
    },
  });
  return (
    <div className="px-8 py-8" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(105, 246, 184, 0.05) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    }}>
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-black text-4xl tracking-tight text-white mb-2">Program Sentinel</h1>
            <p className="text-muted-foreground">
              Autonomous referral scaling engine active. Monitor network spread in real-time.
            </p>
          </div>
          <Link href="/create-program">
            <Button className="bg-gradient-to-br from-primary to-[#06b77f] px-6 py-3 rounded-lg text-[#002919] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(105,246,184,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
              Create New Program
            </Button>
          </Link>
        </div>

        {/* Metric Bento Grid */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          {metricsData.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
          <ConversionMetricCard label="Conversion Rate" value="33.1%" percentage={33.1} />
          <VelocityChartCard label="Network Velocity" value="2.8" unit="pts" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Active Programs */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-white">Active Referral Programs</h3>
              <button className="text-primary text-sm font-bold hover:underline">
                View All Programs
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-72 bg-[#1a1919]" />
                  <Skeleton className="h-72 bg-[#1a1919]" />
                </>
              ) : programs && programs.length > 0 ? (
                programs.map((program, index) => {
                  const colorIndex = index % programColors.length;
                  const iconIndex = index % programIcons.length;
                  return (
                    <ProgramCard
                      key={program.id}
                      id={program.id}
                      icon={programIcons[iconIndex]}
                      iconBgColor={programColors[colorIndex].bg}
                      iconColor={programColors[colorIndex].text}
                      iconBorderColor={programColors[colorIndex].border}
                      title={program.name}
                      description={program.description || 'Operational Campaign'}
                      participantCount="0"
                      rewardText="Referral Reward"
                      status={program.status === 'active' ? 'live' : 'paused'}
                    />
                  );
                })
              ) : (
                <div className="col-span-2 bg-[#0e0e0e] rounded-xl border border-[#1a1919] p-8 text-center">
                  <p className="text-muted-foreground mb-4">No active referral programs yet</p>
                  <Link href="/create-program">
                    <Button className="bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Program
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <ReferralActivityFeed />
        </div>

        {/* System Status Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Sentinel Node: US-EAST-1 ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Latencies: 14ms</span>
            </div>
          </div>
          <span>v2.4.0-STABLE | © 2024 REPGUARDIAN</span>
        </div>
    </div>
  );
}
