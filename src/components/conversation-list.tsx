"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

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
      let query = supabase
        .from("chat")
        .select(`
          *,
          client:client(*)
        `)
        .eq("company_id", companyId)
        .order("status_updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      console.log('Fetching chats for company:', companyId);
      console.log('Chat query result:', data);
      console.log('Chat query error:', error);

      if (error) {
        console.error('Error fetching chats:', JSON.stringify(error, null, 2));
        throw error;
      }

      // For each chat, get messages (all for search, last for display)
      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
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
            console.log('Fetched client for', chat.client_id, ':', fetchedClient, 'Error:', clientError);
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

  return (
    <>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="divide-y">
            {conversations.map((chat: any) => (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 ${
                  selectedChatId === chat.id ? "bg-muted" : ""
                }`}
                onClick={() => handleSelectConversation(chat.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium flex items-center">
                    <span>{chat.client_name || `${chat.client?.first_name || ''} ${chat.client?.last_name || ''}`.trim() || 'Unknown'}</span>
                    {/* Status Indicator */}
                    <div 
                      className="w-[9px] h-[9px] rounded-full flex-shrink-0 ml-[10px]"
                      style={{ backgroundColor: getStatusIndicatorColor(chat.client?.status) }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.lastMessage
                      ? formatDate(chat.lastMessage.created_at)
                      : formatDate(chat.created_at)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {chat.lastMessage ? chat.lastMessage.message : "No messages yet"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery
              ? "No conversations match your search"
              : "No conversations found"}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
