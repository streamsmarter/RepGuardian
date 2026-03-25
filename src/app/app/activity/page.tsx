export const dynamic = 'force-dynamic';

import { ActivityList } from './activity-list';
import { getCompanyContext } from '@/lib/company-context';

export default async function ActivityPage() {
  const { company_id } = await getCompanyContext();
  return (
    <div className="px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ActivityList companyId={company_id} />
      </div>
    </div>
  );
}
