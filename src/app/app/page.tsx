import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

async function getKpiData(companyId: string) {
  const supabase = createServerComponentClient();
  
  // Reviews Collected
  const { data: reviewsCollected, error: reviewsError } = await supabase
    .from('client')
    .select('count')
    .eq('company_id', companyId)
    .eq('review_submitted', true)
    .single();
  
  // Customers Recovered
  const { data: customersRecovered, error: recoveredError } = await supabase
    .from('conflict')
    .select('count(distinct client_id)')
    .eq('company_id', companyId)
    .eq('status', 'closed')
    .single();
  
  // Needs Attention
  const { data: needsAttention, error: attentionError } = await supabase
    .from('conflict')
    .select('count')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .single();
  
  // Recent Activity
  const { data: recentActivity, error: activityError } = await supabase
    .from('chat')
    .select('*, client(*)')
    .eq('company_id', companyId)
    .order('status_updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(10);
  
  return {
    reviewsCollected: reviewsCollected?.count || 0,
    customersRecovered: customersRecovered?.count || 0,
    needsAttention: needsAttention?.count || 0,
    recentActivity: recentActivity || [],
    errors: {
      reviewsError,
      recoveredError,
      attentionError,
      activityError
    }
  };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

export default async function DashboardPage() {
  const { company_id } = await getCompanyContext();
  const kpiData = await getKpiData(company_id);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance and recent activity.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Reviews Collected"
          value={kpiData.reviewsCollected}
          delta={5}
        />
        <KpiCard
          title="Customers Recovered"
          value={kpiData.customersRecovered}
          delta={2}
        />
        <KpiCard
          title="Needs Attention"
          value={kpiData.needsAttention}
          delta={-3}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {kpiData.recentActivity.length === 0 ? (
            <p className="text-muted-foreground">No recent activity found.</p>
          ) : (
            <div className="space-y-4">
              {kpiData.recentActivity.map((chat: any) => (
                <div key={chat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {chat.client?.first_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {chat.client?.first_name} {chat.client?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chat.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(chat.status_updated_at || chat.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
