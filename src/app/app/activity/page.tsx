export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityList } from './activity-list';
import { getCompanyContext } from '@/lib/company-context';

export default async function ActivityPage() {
  const { company_id } = await getCompanyContext();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          View all critical issues, updates, and recent activity.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">All Updates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityList companyId={company_id} />
        </CardContent>
      </Card>
    </div>
  );
}
