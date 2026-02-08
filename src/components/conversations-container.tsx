'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/conversation-list';
import { MessageThread } from '@/components/message-thread';
import { MessageSquare } from 'lucide-react';

interface ConversationsContainerProps {
  companyId: string;
  initialChatId?: string;
}

export function ConversationsContainer({ companyId, initialChatId }: ConversationsContainerProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(initialChatId);

  return (
    <div className="flex h-[500px]">
      {/* Conversations List - Left Side */}
      <div className="w-full md:w-80 lg:w-96 border-r flex flex-col overflow-hidden">
        <ConversationList 
          companyId={companyId} 
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
      </div>
      
      {/* Message Thread - Right Side */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {selectedChatId ? (
          <MessageThread chatId={selectedChatId} companyId={companyId} />
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
  );
}
