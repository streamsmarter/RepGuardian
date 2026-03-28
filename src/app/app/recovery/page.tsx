'use client';

import Link from 'next/link';
import { Plus, TrendingUp, Sparkles, Award, Sun, Gift, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard, ConversionMetricCard, VelocityChartCard } from '@/components/dashboard/metric-card';
import { ProgramCard } from '@/components/dashboard/program-card';
import { ReferralActivityFeed } from '@/components/dashboard/referral-activity-feed';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  company_id: string;
}

const metricsData = [
  {
    label: 'Recovery Attempts',
    value: '2.1k',
    footerIcon: TrendingUp,
    footerText: '+8.3% vs last month',
    footerColor: 'text-primary',
  },
  {
    label: 'Customers Recovered',
    value: '847',
    footerIcon: Sparkles,
    footerText: 'Value: $42.3k',
    footerColor: 'text-secondary',
  },
];

const programIcons = [HeartHandshake, Award, Sun, Gift, Sparkles];
const programColors = [
  { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' },
  { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
];

export default function RecoveryPage() {
  const supabase = createBrowserComponentClient();

  // Fetch active referral programs (for recovery campaigns)
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['recovery-programs'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('referral_program') as any)
        .select('id, name, description, status, created_at, company_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReferralProgram[];
    },
  });

  const activePrograms = programs || [];

  return (
    <div className="px-8 py-8" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(105, 246, 184, 0.05) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    }}>
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-black text-4xl tracking-tight text-white mb-2">Customer Recovery</h1>
            <p className="text-muted-foreground">
              Win back at-risk customers with targeted recovery campaigns and personalized outreach.
            </p>
          </div>
          <Link href="/create-program">
            <Button className="bg-gradient-to-br from-primary to-[#06b77f] px-6 py-3 rounded-lg text-[#002919] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(105,246,184,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
              Create Recovery Campaign
            </Button>
          </Link>
        </div>

        {/* Metric Bento Grid */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          {metricsData.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
          <ConversionMetricCard label="Recovery Rate" value="40.3%" percentage={40.3} />
          <VelocityChartCard label="Recovery Velocity" value="3.2" unit="pts" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Active Programs */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-white">Active Recovery Campaigns</h3>
              <button className="text-primary text-sm font-bold hover:underline">
                View All Campaigns
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {programsLoading ? (
                <>
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-48 rounded-xl" />
                </>
              ) : activePrograms.length === 0 ? (
                <div className="col-span-2 bg-[#1a1919] rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">No active recovery campaigns found.</p>
                  <Link href="/create-program">
                    <Button className="mt-4 bg-primary/20 text-primary hover:bg-primary/30">
                      Create Your First Campaign
                    </Button>
                  </Link>
                </div>
              ) : (
                activePrograms.map((program, index) => {
                  const colorIndex = index % programColors.length;
                  const IconComponent = programIcons[index % programIcons.length];
                  const colors = programColors[colorIndex];
                  
                  return (
                    <ProgramCard
                      key={program.id}
                      id={program.id}
                      icon={IconComponent}
                      iconBgColor={colors.bg}
                      iconColor={colors.text}
                      iconBorderColor={colors.border}
                      title={program.name}
                      description={program.description || 'Recovery Campaign'}
                      participantCount="0"
                      rewardText="Recovery Reward"
                      status={program.status === 'active' ? 'live' : 'paused'}
                    />
                  );
                })
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
              <span>Recovery Node: US-EAST-1 ACTIVE</span>
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
