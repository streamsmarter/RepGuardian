"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationListProps {
  companyId: string;
  selectedChatId?: string;
  onSelectChat?: (chatId: string) => void;
}

interface ChatRecord {
  id: string;
  client_id: string | null;
  client_name?: string | null;
  created_at: string;
  client?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

interface MessageRecord {
  session_id: string;
  message: string | null;
  created_at: string;
}

interface ConflictRecord {
  client_id: string;
  status: string;
}

export function ConversationList({ companyId, selectedChatId, onSelectChat }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const supabase = createBrowserComponentClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", companyId, searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat")
        .select(`
          *,
          client:client(*)
        `)
        .eq("company_id", companyId)
        .order("status_updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching chats:", JSON.stringify(error, null, 2));
        throw error;
      }

      const chats = (data || []) as ChatRecord[];
      const chatIds = chats.map((chat) => chat.id);
      const clientIds = chats
        .map((chat) => chat.client_id)
        .filter((clientId): clientId is string => !!clientId);

      const [{ data: messageRows, error: messagesError }, { data: conflictRows, error: conflictsError }] = await Promise.all([
        chatIds.length > 0
          ? supabase
              .from("messages")
              .select("session_id, message, created_at")
              .in("session_id", chatIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        clientIds.length > 0
          ? supabase
              .from("conflict")
              .select("client_id, status")
              .eq("company_id", companyId)
              .in("client_id", clientIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (messagesError) {
        console.error("Error fetching messages:", JSON.stringify(messagesError, null, 2));
        throw messagesError;
      }

      if (conflictsError) {
        console.error("Error fetching conflicts:", JSON.stringify(conflictsError, null, 2));
        throw conflictsError;
      }

      const lastMessageBySession = new Map<string, MessageRecord>();
      for (const row of (messageRows || []) as MessageRecord[]) {
        if (!lastMessageBySession.has(row.session_id)) {
          lastMessageBySession.set(row.session_id, row);
        }
      }

      const conflictStatusByClient = new Map<string, "open" | "needs_attention" | "resolved">();
      for (const row of (conflictRows || []) as ConflictRecord[]) {
        const current = conflictStatusByClient.get(row.client_id) || "open";
        if (row.status === "active") {
          conflictStatusByClient.set(row.client_id, "needs_attention");
        } else if (row.status === "closed" && current !== "needs_attention") {
          conflictStatusByClient.set(row.client_id, "resolved");
        }
      }

      const chatsWithMetadata = chats.map((chat) => ({
        ...chat,
        lastMessage: lastMessageBySession.get(chat.id) || null,
        status: chat.client_id ? (conflictStatusByClient.get(chat.client_id) || "open") : "open",
      }));

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return chatsWithMetadata.filter((chat) => {
          const clientName = chat.client_name?.toLowerCase() || "";
          const firstName = chat.client?.first_name?.toLowerCase() || "";
          const lastName = chat.client?.last_name?.toLowerCase() || "";
          const lastMessage = chat.lastMessage?.message?.toLowerCase() || "";

          return (
            clientName.includes(query) ||
            firstName.includes(query) ||
            lastName.includes(query) ||
            lastMessage.includes(query)
          );
        });
      }

      return chatsWithMetadata;
    },
    staleTime: 1000 * 60,
  });

  const handleSelectConversation = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      router.push(`/app/inbox?chat=${chatId}`);
    }
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
    return conversations.filter((chat) => chat.status === "needs_attention").length;
  };

  return (
    <>
      <div className="p-8 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">Active Threads</h1>
        {getNewCount() > 0 && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
            {getNewCount()} NEW
          </span>
        )}
      </div>

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
            {conversations.map((chat) => {
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
                      {chat.client_name || `${chat.client?.first_name || ''} ${chat.client?.last_name || ''}`.trim() || "Unknown"}
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
