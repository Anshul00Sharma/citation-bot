import { useState, useEffect, useCallback } from "react";
import { useSessionStore } from "@/store/useSessionStore";

const API_BASE_URL =
  "https://citation-bot-backend-983894129463.europe-west1.run.app";

export interface ChatMessage {
  session_id: string;
  sender: "user" | "ai";
  message: string;
  created_at: string;
  have_citation?: boolean;
  citation?: string | null;
}

export function useChat() {
  const { sessionId } = useSessionStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/?session_id=${encodeURIComponent(sessionId)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }
      const data: ChatMessage[] = await response.json();
      setMessages(data);
    } catch (err: any) {
      console.error("[Chat] Error fetching history:", err);
      // We don't want to throw an intrusive error if history is just empty or fails initially
      setError(err.message || "Failed to load chat history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const sendMessage = async (messageText: string) => {
    if (!sessionId || !messageText.trim()) return;

    setIsSending(true);
    setError(null);
    
    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      session_id: sessionId,
      sender: "user",
      message: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageText
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const aiResponse: ChatMessage = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      console.error("[Chat] Error sending message:", err);
      setError(err.message || "Failed to send message");
      
      // Optionally remove the optimistic user message if we want to be strict,
      // but usually we keep it and show an error state. For simplicity, we just set the error.
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isLoadingHistory,
    isSending,
    error,
    sendMessage,
    refreshHistory: fetchHistory
  };
}
