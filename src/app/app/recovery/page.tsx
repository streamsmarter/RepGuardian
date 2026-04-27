'use client';

import Link from 'next/link';
import { Settings, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard, ConversionMetricCard } from '@/components/dashboard/metric-card';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ReminderWithClient {
  id: string;
  client_id: string;
  reminder_message: string;
  reengaged_date: string;
  created_at: string;
  status: string;
  type: string;
  client_name: string;
  client: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  } | null;
}

export default function RecoveryPage() {
  const supabase = createBrowserComponentClient();

  // Fetch all reminders for metrics calculation
  const { data: allReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['reengagement-reminders'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('reminder') as any)
        .select(`
          id,
          client_id,
          reminder_message,
          reengaged_date,
          created_at,
          status,
          type,
          client_name,
          client:client_id (
            first_name,
            last_name,
            phone_number,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reminders:', error);
        return [];
      }
      return (data || []) as ReminderWithClient[];
    },
    retry: false,
  });

  // Calculate metrics from all reminders
  const totalReminders = allReminders?.length || 0;
  const succeededReminders = allReminders?.filter(r => r.status === 'succeeded').length || 0;
  const recoveryRate = totalReminders > 0 ? (succeededReminders / totalReminders) * 100 : 0;

  // Get most recent reminder per client for display
  const reengagedClients = (() => {
    const latestByClient = new Map<string, ReminderWithClient>();
    for (const reminder of allReminders || []) {
      if (!latestByClient.has(reminder.client_id)) {
        latestByClient.set(reminder.client_id, reminder);
      }
    }
    return Array.from(latestByClient.values());
  })();

  return (
    <div className="px-4 md:px-8 py-6 md:py-8" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(105, 246, 184, 0.05) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    }}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-10">
          <div>
            <h1 className="font-black text-2xl md:text-4xl tracking-tight text-white mb-2">Customer Recovery</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Win back at-risk customers with targeted recovery campaigns and personalized outreach.
            </p>
          </div>
          <Link href="/app/recovery/conditions">
            <Button className="bg-gradient-to-br from-primary to-[#06b77f] px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-[#002919] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(105,246,184,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-sm md:text-base">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
              Edit Conditions
            </Button>
          </Link>
        </div>

        {/* Metric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <MetricCard
            label="Recovery Attempts"
            value={totalReminders.toLocaleString()}
            footerIcon={TrendingUp}
            footerText="Total reminders sent"
            footerColor="text-primary"
          />
          <MetricCard
            label="Customers Recovered"
            value={succeededReminders.toLocaleString()}
            footerIcon={Sparkles}
            footerText="Successfully reengaged"
            footerColor="text-secondary"
          />
          <ConversionMetricCard label="Recovery Rate" value={`${recoveryRate.toFixed(1)}%`} percentage={recoveryRate} />
        </div>

        {/* Main Content Grid */}
        <div className="bg-[#262626]/40 backdrop-blur-xl border border-primary/5 rounded-2xl p-4 md:p-6">
          {/* Recovered Clients */}
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-extrabold text-white">Recovered Clients</h3>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name</th>
                    <th className="text-left py-3 px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Message Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {remindersLoading ? (
                    <tr>
                      <td colSpan={3} className="py-4">
                        <Skeleton className="h-10 rounded-lg" />
                      </td>
                    </tr>
                  ) : reengagedClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8">
                        <p className="text-muted-foreground">No reengagements</p>
                      </td>
                    </tr>
                  ) : (
                    reengagedClients.map((reminder) => (
                      <tr key={reminder.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold text-xs">
                                {(reminder.client?.first_name?.[0] || reminder.client_name?.[0] || '?')}
                                {(reminder.client?.last_name?.[0] || '')}
                              </span>
                            </div>
                            <span className="text-white font-medium">
                              {reminder.client ? `${reminder.client.first_name} ${reminder.client.last_name}` : reminder.client_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            reminder.status === 'succeeded' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                          }`}>
                            {reminder.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {reminder.created_at ? new Date(reminder.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Recovery Mode: Active</span>
          </div>
        </div>
    </div>
  );
}
