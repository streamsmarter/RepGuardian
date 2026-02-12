"use client";

import { useEffect } from "react";
import { createBrowserComponentClient } from "@/lib/supabase/client";

export function useRealtimeMessages(
  chatId: string,
  onNewMessage: (m: any) => void
) {
  useEffect(() => {
    if (!chatId) return;

    const supabase = createBrowserComponentClient();

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${chatId}`,
        },
        (payload) => {
          onNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, onNewMessage]);
}
