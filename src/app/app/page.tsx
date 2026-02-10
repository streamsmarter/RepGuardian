import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientList } from '@/components/client-list';
import { DashboardHeader } from '@/components/dashboard-header';

async function getKpiData(companyId: string) {
  const supabase = await createServerComponentClient();
  
  // Reviews Collected
  const { count: reviewsCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('review_submitted', true);
  
  // Customers Recovered
  const { count: recoveredCount } = await supabase
    .from('conflict')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'closed');
  
  // Needs Attention - count clients with status "conflict" or "needs_human"
  const { count: attentionCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['conflict', 'needs_human']);
  
  return {
    reviewsCollected: reviewsCount || 0,
    customersRecovered: recoveredCount || 0,
    needsAttention: attentionCount || 0,
  };
}

export default async function DashboardPage() {
  const { company_id, user } = await getCompanyContext();
  console.log('Dashboard - User:', user.email, 'Company ID:', company_id);
  
  // Debug: Check what chats exist
  const supabase = await createServerComponentClient();
  const { data: allChats, error: chatError } = await supabase
    .from('chat')
    .select('id, company_id, client_name')
    .limit(5);
  console.log('DEBUG - All chats:', allChats, 'Error:', chatError);
  
  const { data: companyChats } = await supabase
    .from('chat')
    .select('id, company_id, client_name')
    .eq('company_id', company_id)
    .limit(5);
  console.log('DEBUG - Company chats:', companyChats);
  
  const kpiData = await getKpiData(company_id);
  
  return (
    <div className="p-6 space-y-6 h-full">
      {/* Header with LightRays background */}
      <DashboardHeader />
      
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Reviews Collected"
          value={kpiData.reviewsCollected}
          delta={5}
          description="Total reviews from customers"
        />
        <KpiCard
          title="Potential Revenue Recovered"
          value={kpiData.customersRecovered}
          delta={2}
          description="Estimated monthly recurring revenue recovered"
        />
        <KpiCard
          title="Needs Attention"
          value={kpiData.needsAttention}
          delta={-3}
          description="Clients that need your attention"
        />
      </div>
      
      {/* Clients List */}
      <Card className="flex-1">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ClientList companyId={company_id} />
        </CardContent>
      </Card>
    </div>
  );
}
