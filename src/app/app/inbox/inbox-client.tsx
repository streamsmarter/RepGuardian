'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/conversation-list';
import { MessageThread } from '@/components/message-thread';
import { MessageSquare } from 'lucide-react';

interface InboxClientProps {
  companyId: string;
  initialChatId?: string;
}

export function InboxClient({ companyId, initialChatId }: InboxClientProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(initialChatId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations List - Left Side */}
      <section className="w-80 lg:w-96 flex flex-col bg-[#1a1919] border-r border-white/5 shrink-0">
        <ConversationList 
          companyId={companyId} 
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
      </section>
      
      {/* Message Thread - Right Side */}
      <section className="hidden md:flex flex-1 flex-col bg-[#0e0e0e] relative overflow-hidden">
        {selectedChatId ? (
          <MessageThread chatId={selectedChatId} companyId={companyId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#201f1f] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-[#adaaaa]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No conversation selected</h3>
              <p className="text-[#adaaaa] text-sm max-w-[250px]">
                Select a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
