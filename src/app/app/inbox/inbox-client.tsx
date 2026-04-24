'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/conversation-list';
import { MessageThread } from '@/components/message-thread';
import { MessageSquare, ArrowLeft } from 'lucide-react';

interface InboxClientProps {
  companyId: string;
  initialChatId?: string;
}

export function InboxClient({ companyId, initialChatId }: InboxClientProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(initialChatId);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = () => {
    setSelectedChatId(undefined);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations List - Left Side (hidden on mobile when chat selected) */}
      <section className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col bg-[#1a1919] border-r border-white/5 md:shrink-0`}>
        <ConversationList 
          companyId={companyId} 
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </section>
      
      {/* Message Thread - Right Side (full width on mobile when chat selected) */}
      <section className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0e0e0e] relative overflow-hidden`}>
        {selectedChatId ? (
          <div className="flex flex-col h-full">
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#1a1919]">
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-[#201f1f] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold">Back to conversations</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MessageThread chatId={selectedChatId} companyId={companyId} />
            </div>
          </div>
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
