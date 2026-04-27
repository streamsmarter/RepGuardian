/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { Send, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface MessageThreadProps {
  chatId: string;
  companyId: string;
}

export function MessageThread({ chatId, companyId }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch messages for the selected chat
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      // Ensure chatId is treated as a string for exact matching with session_id
      const chatIdString = String(chatId);
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", chatIdString)
        .order("created_at", { ascending: true });


      if (error) {
        console.error('Error fetching messages:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Double-check filter on client side to ensure exact match
      const filteredMessages = (data || []).filter(
        (msg: any) => msg.session_id === chatIdString
      );
      
      return filteredMessages;
    },
    staleTime: 1000 * 10, // 10 seconds
  });

  // Realtime message handler
  const handleNewMessage = useCallback((msg: any) => {
    queryClient.setQueryData(["messages", chatId], (prev: any[] | undefined) => {
      if (!prev) return [msg];
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, [chatId, queryClient]);

  // Subscribe to realtime message inserts
  useRealtimeMessages(chatId, handleNewMessage);

  // Instantly scroll to bottom when messages load (no animation)
  useEffect(() => {
    if (messages && messages.length > 0 && scrollAreaRef.current) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    }
  }, [messages, chatId]);

  // Fetch chat details including client info
  const { data: chatDetails } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat")
        .select(`
          *,
          client:client(*)
        `)
        .eq("id", chatId)
        .eq("company_id", companyId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          chat_id: chatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Send message error:", response.status, errorData);
        throw new Error(errorData.error || `Failed to send message (${response.status})`);
      }

      return response;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  // Toggle autopilot mutation using RPC
  const toggleAutopilotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await (supabase.rpc as any)("set_chat_autopilot", {
        p_chat_id: chatId,
        p_autopilot: enabled,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update autopilot: ${error.message}`);
    },
  });

  const handleAutopilotToggle = (enabled: boolean) => {
    toggleAutopilotMutation.mutate(enabled);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getClientInitials = () => {
    const name = (chatDetails as any)?.client_name || 
      `${(chatDetails as any)?.client?.first_name || ''} ${(chatDetails as any)?.client?.last_name || ''}`.trim();
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getClientName = () => {
    return (chatDetails as any)?.client_name || 
      `${(chatDetails as any)?.client?.first_name || ''} ${(chatDetails as any)?.client?.last_name || ''}`.trim() || 
      'Unknown';
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="h-24 flex items-center justify-between px-12 border-b border-white/5">
        {chatDetails ? (
          <>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#201f1f] to-[#262626] flex items-center justify-center border border-white/10">
                <span className="text-primary font-bold">{getClientInitials()}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{getClientName()}</h2>
                <p className="text-xs text-primary flex items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                  {(chatDetails as any).client?.phone_number || 'Active'}
                </p>
              </div>
            </div>
            {/* Autopilot Switch */}
            <div className="flex items-center space-x-3 bg-[#131313] p-2 px-4 rounded-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
                Autopilot
              </span>
              <button
                onClick={() => handleAutopilotToggle(!(chatDetails as any)?.autopilot)}
                disabled={toggleAutopilotMutation.isPending}
                className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-colors ${
                  (chatDetails as any)?.autopilot 
                    ? 'bg-primary/20' 
                    : 'bg-[#262626]'
                }`}
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    (chatDetails as any)?.autopilot 
                      ? 'bg-primary shadow-[0_0_8px_rgba(105,246,184,0.6)] translate-x-4' 
                      : 'bg-[#777575] translate-x-0'
                  }`} 
                />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-12 space-y-8 hide-scrollbar">
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex flex-col ${i % 2 === 0 ? "items-start" : "items-end"} max-w-2xl ${i % 2 !== 0 ? "ml-auto" : ""} space-y-2`}
              >
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {/* System Sync Timestamp */}
            <div className="flex justify-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#adaaaa]/40 uppercase">
                Conversation Started
              </span>
            </div>
            
            {messages.map((message: any) => {
              const isUserMessage = message.role === "human";
              const isAiHidden = message.role === "ai_hidden";
              const isAI = message.role === "ai";
              const isRepresentative = message.role === "representative";
              
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUserMessage ? "items-start" : "items-end"} max-w-2xl ${!isUserMessage ? "ml-auto" : ""} space-y-2`}
                >
                  <div
                    className={`p-6 rounded-2xl text-sm leading-relaxed ${
                      isUserMessage
                        ? "bg-[#1a1919] text-[#adaaaa] rounded-tl-none shadow-sm"
                        : isAiHidden
                        ? "bg-[#2D3561]/30 text-[#8596ff] rounded-tr-none border border-dashed border-[#3d4470]/50"
                        : isAI
                        ? "bg-primary/5 text-[#58e7ab] rounded-tr-none border border-primary/10"
                        : isRepresentative
                        ? "bg-[#6C5CE7]/20 text-[#c7cdff] rounded-tr-none border border-[#6C5CE7]/20"
                        : "bg-primary/5 text-[#58e7ab] rounded-tr-none border border-primary/10"
                    }`}
                  >
                    {message.message}
                  </div>
                  <div className={`flex items-center space-x-2 ${isUserMessage ? "ml-2" : "mr-2"}`}>
                    {(isAI || isAiHidden) && (
                      <Sparkles className="w-3 h-3 text-primary" />
                    )}
                    <span className={`text-[9px] font-medium uppercase ${
                      isUserMessage 
                        ? "text-[#adaaaa]/50" 
                        : isAiHidden
                        ? "text-[#8596ff]/70"
                        : "text-primary/70"
                    }`}>
                      {isUserMessage 
                        ? getClientName() 
                        : isAiHidden 
                        ? "Draft" 
                        : isRepresentative
                        ? "Representative"
                        : "Sentinel AI"
                      } | {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-[#adaaaa]">
              No messages in this conversation yet
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 md:p-12 pt-0">
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all" />
          <div className="relative flex items-center bg-[#131313] rounded-2xl p-3 md:p-4 pl-4 md:pl-6 border border-white/5 group-focus-within:border-primary/30 transition-all">
            <input
              type="text"
              placeholder="Transmit your response..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendMessageMutation.isPending}
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-white placeholder:text-[#adaaaa]/40"
            />
            <div className="flex items-center pl-2">
              <button
                type="submit"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-[#002919] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

