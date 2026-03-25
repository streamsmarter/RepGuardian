"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ConversationListProps {
  companyId: string;
  selectedChatId?: string;
  onSelectChat?: (chatId: string) => void;
}

export function ConversationList({ companyId, selectedChatId, onSelectChat }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const supabase = createBrowserComponentClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", companyId, searchQuery],
    queryFn: async () => {
      // Base query for chats
      const query = supabase
        .from("chat")
        .select(`
          *,
          client:client(*)
        `)
        .eq("company_id", companyId)
        .order("status_updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const { data, error } = await query;


      if (error) {
        console.error('Error fetching chats:', JSON.stringify(error, null, 2));
        throw error;
      }

      // For each chat, get messages (all for search, last for display)
      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat: any) => {
          const { data: allMessages } = await supabase
            .from("messages")
            .select("message, created_at")
            .eq("session_id", chat.id)
            .order("created_at", { ascending: false });
          
          const lastMessage = allMessages && allMessages.length > 0 ? allMessages[0] : null;

          // Check if there are active conflicts for this client
          const { data: activeConflicts } = await supabase
            .from("conflict")
            .select("status")
            .eq("client_id", chat.client_id)
            .eq("company_id", companyId)
            .eq("status", "active");

          // Fetch client data separately if not included in relation
          let clientData = chat.client;
          if (!clientData && chat.client_id) {
            const { data: fetchedClient, error: clientError } = await supabase
              .from("client")
              .select("id, first_name, last_name, phone_number, review_submitted, review_request_sent, status")
              .eq("id", chat.client_id)
              .single();
            clientData = fetchedClient;
          }

          // Check if there are closed conflicts for this client
          const { data: closedConflicts } = await supabase
            .from("conflict")
            .select("status")
            .eq("client_id", chat.client_id)
            .eq("company_id", companyId)
            .eq("status", "closed");

          // Determine conversation status
          let status = "open";
          if (activeConflicts && activeConflicts.length > 0) {
            status = "needs_attention";
          } else if (closedConflicts && closedConflicts.length > 0) {
            status = "resolved";
          }

          return {
            ...chat,
            client: clientData,
            lastMessage,
            allMessages: allMessages || [],
            status
          };
        })
      );

      // Apply client-side search filter if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return chatsWithMessages.filter((chat: any) => {
          // Search by client_name
          const clientName = chat.client_name?.toLowerCase() || '';
          // Search by client first/last name (fallback)
          const firstName = chat.client?.first_name?.toLowerCase() || '';
          const lastName = chat.client?.last_name?.toLowerCase() || '';
          // Search by message content
          const hasMatchingMessage = chat.allMessages?.some(
            (msg: any) => msg.message?.toLowerCase().includes(query)
          );
          
          return clientName.includes(query) || 
                 firstName.includes(query) || 
                 lastName.includes(query) || 
                 hasMatchingMessage;
        });
      }

      return chatsWithMessages;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const handleSelectConversation = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      router.push(`/app/inbox?chat=${chatId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "needs_attention":
        return <Badge variant="destructive">Needs Attention</Badge>;
      case "resolved":
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return <Badge>Open</Badge>;
    }
  };

  const getReviewBadge = (client: any) => {
    if (client.review_submitted) {
      return <Badge className="bg-green-500">Reviewed</Badge>;
    }
    if (client.review_request_sent) {
      return <Badge variant="secondary">Requested</Badge>;
    }
    return null;
  };

  // Status Indicator - returns color based on client.status from Supabase
  const getStatusIndicatorColor = (clientStatus: string | null | undefined) => {
    if (clientStatus === "conflict" || clientStatus === "needs_human") {
      return "#CD8500"; // orange/amber for attention needed
    }
    return "#3ecf8e"; // green (default)
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
      }).format(date);
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date);
    }
  };

  const getNewCount = () => {
    if (!conversations) return 0;
    return conversations.filter((chat: any) => chat.status === "needs_attention").length;
  };

  return (
    <>
      {/* Header */}
      <div className="p-8 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">Active Threads</h1>
        {getNewCount() > 0 && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
            {getNewCount()} NEW
          </span>
        )}
      </div>

      {/* Search - hidden for now, can be toggled */}
      <div className="px-4 pb-4 hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777575]" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-[#131313] text-white text-sm pl-10 pr-4 py-3 rounded-lg border-0 ring-1 ring-[#484847]/20 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-[#777575]/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1 px-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <>
            {conversations.map((chat: any) => {
              const isSelected = selectedChatId === chat.id;
              const needsAttention = chat.status === "needs_attention";
              const isResolved = chat.status === "resolved";
              
              return (
                <div
                  key={chat.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all group ${
                    isSelected 
                      ? "bg-[#201f1f] border-l-2 border-primary" 
                      : "hover:bg-[#201f1f]"
                  } ${isResolved ? "opacity-60" : ""}`}
                  onClick={() => handleSelectConversation(chat.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm ${
                      isSelected ? "text-primary" : "text-white group-hover:text-primary"
                    } transition-colors`}>
                      {chat.client_name || `${chat.client?.first_name || ''} ${chat.client?.last_name || ''}`.trim() || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-[#adaaaa] uppercase tracking-wider">
                      {chat.lastMessage
                        ? formatDate(chat.lastMessage.created_at)
                        : formatDate(chat.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#adaaaa] line-clamp-1">
                    {chat.lastMessage ? chat.lastMessage.message : "No messages yet"}
                  </p>
                  {needsAttention && (
                    <div className="mt-3 flex space-x-2">
                      <span className="px-2 py-0.5 bg-[#262626] text-[#8596ff] text-[9px] font-bold rounded-full uppercase tracking-tighter">
                        SLA: Priority
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="p-4 text-center text-[#adaaaa]">
            {searchQuery
              ? "No conversations match your search"
              : "No conversations found"}
          </div>
        )}
      </div>
    </>
  );
}
