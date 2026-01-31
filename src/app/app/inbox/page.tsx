import { createServerComponentClient } from '@/lib/supabase/server';
import { getCompanyContext } from '@/lib/company-context';
import { ConversationList } from '@/components/conversation-list';
import { MessageThread } from '@/components/message-thread';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { chat?: string };
}) {
  const { company_id } = await getCompanyContext();
  const selectedChatId = searchParams.chat;
  
  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      <div className="w-full md:w-80 lg:w-96 border-r overflow-hidden flex flex-col">
        <ConversationList companyId={company_id} selectedChatId={selectedChatId} />
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedChatId ? (
          <MessageThread chatId={selectedChatId} companyId={company_id} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium">No conversation selected</h3>
              <p className="text-muted-foreground">
                Select a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
