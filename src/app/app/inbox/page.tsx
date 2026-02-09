import { getCompanyContext } from '@/lib/company-context';
import { InboxClient } from './inbox-client';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { chat?: string };
}) {
  const { company_id } = await getCompanyContext();
  const initialChatId = searchParams.chat;
  
  return <InboxClient companyId={company_id} initialChatId={initialChatId} />;
}
