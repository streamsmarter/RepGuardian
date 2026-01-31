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
}

export function ConversationList({ companyId, selectedChatId }: ConversationListProps) {
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

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(
          `client.first_name.ilike.%${searchQuery}%,client.last_name.ilike.%${searchQuery}%,client.phone_number.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // For each chat, get the last message
      const chatsWithLastMessage = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("session_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Check if there are active conflicts for this client
          const { data: activeConflicts } = await supabase
            .from("conflict")
            .select("status")
            .eq("client_id", chat.client_id)
            .eq("company_id", companyId)
            .eq("status", "active");

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
            lastMessage: messages && messages.length > 0 ? messages[0] : null,
            status
          };
        })
      );

      return chatsWithLastMessage;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const handleSelectConversation = (chatId: string) => {
    router.push(`/app/inbox?chat=${chatId}`);
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
            type="search"
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
                  <div className="font-medium">
                    {chat.client?.first_name} {chat.client?.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.lastMessage
                      ? formatDate(chat.lastMessage.created_at)
                      : formatDate(chat.created_at)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {chat.lastMessage ? chat.lastMessage.content : "No messages yet"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(chat.status)}
                  {chat.client && getReviewBadge(chat.client)}
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
