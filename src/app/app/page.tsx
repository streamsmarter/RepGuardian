import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientList } from '@/components/client-list';

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
      {/* Header with wavy background */}
      <div className="relative overflow-hidden rounded-3xl mt-2" style={{ backgroundColor: '#3ecf8e' }}>
        {/* Wavy SVG background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="white"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            fill="white"
            opacity="0.5"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,154.7C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <div className="relative z-10 px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-white/80">
            Overview of your business performance and recent activity.
          </p>
        </div>
      </div>
      
      
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
