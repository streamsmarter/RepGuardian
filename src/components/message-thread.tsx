"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Fetch messages for the selected chat
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", chatId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 10, // 10 seconds
  });

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
        content,
        message: { content, role: "assistant" },
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(newMessageData)
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
                {chatDetails.client?.first_name} {chatDetails.client?.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {chatDetails.client?.phone_number}
              </p>
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
      <ScrollArea className="flex-1 p-4">
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
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === "assistant"
                      ? "bg-muted text-foreground mr-auto"
                      : "bg-primary text-primary-foreground ml-auto"
                  }`}
                >
                  <div className="mb-1">{message.content}</div>
                  <div className="text-xs opacity-70 text-right">
                    {formatDate(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              No messages in this conversation yet
            </div>
          </div>
        )}
      </ScrollArea>

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
