"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

      console.log('Fetching messages for chat:', chatIdString);
      console.log('Messages result:', data);
      console.log('Messages error:', error);

      if (error) {
        console.error('Error fetching messages:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Double-check filter on client side to ensure exact match
      const filteredMessages = (data || []).filter(
        (msg: any) => msg.session_id === chatIdString
      );
      
      console.log('Filtered messages:', filteredMessages.length);
      return filteredMessages;
    },
    staleTime: 1000 * 10, // 10 seconds
  });

  // Instantly scroll to bottom when messages load (no animation)
  useEffect(() => {
    if (messages && messages.length > 0 && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
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
      const newMessageData = {
        session_id: chatId,
        role: "assistant",
        message: content,
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(newMessageData as any)
        .select();

      if (error) {
        throw error;
      }

      return data;
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        {chatDetails ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {(chatDetails as any).client_name || `${(chatDetails as any).client?.first_name || ''} ${(chatDetails as any).client?.last_name || ''}`.trim() || 'Unknown'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {(chatDetails as any).client?.phone_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="autopilot" className="text-sm text-muted-foreground">
                Autopilot
              </Label>
              <Switch
                id="autopilot"
                checked={(chatDetails as any)?.autopilot ?? false}
                onCheckedChange={handleAutopilotToggle}
                disabled={toggleAutopilotMutation.isPending}
              />
            </div>
          </div>
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
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]>div]:!min-h-full [&>[data-radix-scroll-area-viewport]>div]:!flex [&>[data-radix-scroll-area-viewport]>div]:!flex-col [&>[data-radix-scroll-area-viewport]>div]:!justify-end">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`max-w-[70%] ${i % 2 === 0 ? "mr-auto" : "ml-auto"}`}>
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message: any) => {
                  const isUserMessage = message.role === "human";
                  const isAiHidden = message.role === "ai_hidden";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUserMessage ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isUserMessage
                            ? "bg-muted text-foreground mr-auto"
                            : isAiHidden
                            ? "bg-[#2D3561] text-white ml-auto border border-dashed border-[#3d4470]"
                            : "bg-primary text-primary-foreground ml-auto"
                        }`}
                      >
                        <div className="mb-1">{message.message}</div>
                        <div className={`text-xs text-right ${isAiHidden ? "opacity-80" : "opacity-70"}`}>
                          {isAiHidden && <span className="mr-2">Draft</span>}
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                  No messages in this conversation yet
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Composer */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
