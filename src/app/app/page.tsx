import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConversationList } from '@/components/conversation-list';
import { MessageThread } from '@/components/message-thread';
import { MessageSquare } from 'lucide-react';

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
  
  // Needs Attention
  const { count: attentionCount } = await supabase
    .from('conflict')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active');
  
  return {
    reviewsCollected: reviewsCount || 0,
    customersRecovered: recoveredCount || 0,
    needsAttention: attentionCount || 0,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { chat?: string };
}) {
  const { company_id } = await getCompanyContext();
  const kpiData = await getKpiData(company_id);
  const selectedChatId = searchParams.chat;
  
  return (
    <div className="p-6 space-y-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance and recent activity.
        </p>
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
          title="Customers Recovered"
          value={kpiData.customersRecovered}
          delta={2}
          description="Resolved conflicts"
        />
        <KpiCard
          title="Needs Attention"
          value={kpiData.needsAttention}
          delta={-3}
          description="Active conflicts requiring action"
        />
      </div>
      
      {/* Conversations Container */}
      <Card className="flex-1">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-[500px]">
            {/* Conversations List - Left Side */}
            <div className="w-full md:w-80 lg:w-96 border-r flex flex-col overflow-hidden">
              <ConversationList companyId={company_id} selectedChatId={selectedChatId} />
            </div>
            
            {/* Message Thread - Right Side */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden">
              {selectedChatId ? (
                <MessageThread chatId={selectedChatId} companyId={company_id} />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/20">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px]">
                      Select a conversation from the list to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
