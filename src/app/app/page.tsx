export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { Users, Heart, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { CriticalUpdates } from '@/components/critical-updates';

async function getKpiData(companyId: string) {
  const supabase = await createServerComponentClient();
  
  // Retention Rate - percentage of clients not in conflict/needs_human status
  const { count: totalClients } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  const { count: retainedClients } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .not('status', 'in', '(conflict,needs_human,churned)');
  
  const retentionRate = totalClients ? Math.round((retainedClients || 0) / totalClients * 100) : 0;
  
  // Health Score - based on positive feedback ratio
  const { count: totalFeedback } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  const { count: positiveFeedback } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('sentiment_score', 4);
  
  const healthScore = totalFeedback ? Math.round((positiveFeedback || 0) / totalFeedback * 100) : 0;
  
  // Needs Attention - count clients with status "conflict" or "needs_human"
  const { count: attentionCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['conflict', 'needs_human']);
  
  return {
    retentionRate,
    healthScore,
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
          title="Retention Rate"
          value={`${kpiData.retentionRate}%`}
          icon={Users}
          color="#10b981"
        />
        <KpiCard
          title="Health Score"
          value={`${kpiData.healthScore}%`}
          icon={Heart}
          color="#f43f5e"
        />
        <KpiCard
          title="Needs Attention"
          value={kpiData.needsAttention}
          icon={AlertTriangle}
          color="#f59e0b"
        />
      </div>
      
      {/* Critical Updates */}
      <Card>
        <CriticalUpdates />
      </Card>
    </div>
  );
}
