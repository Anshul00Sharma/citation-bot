"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";

const API_BASE_URL =
  "https://citation-bot-backend-983894129463.europe-west1.run.app";

export function useHandshake() {
  const { sessionId, setSessionId, setLoading } = useSessionStore();

  useEffect(() => {
    // If we already have a session_id, skip the handshake
    if (sessionId) return;

    const performHandshake = async () => {
      setLoading(true);
      try {
        // Generate a unique session id
        const newSessionId = crypto.randomUUID();

        const response = await fetch(`${API_BASE_URL}/api/users/handshake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: newSessionId }),
        });

        if (!response.ok) {
          throw new Error(`Handshake failed with status ${response.status}`);
        }

        const data = await response.json();
        // Save the session_id returned by the backend
        setSessionId(data.session_id);
        console.log("[Handshake] Session established:", data.session_id);
      } catch (error) {
        console.error("[Handshake] Error:", error);
      } finally {
        setLoading(false);
      }
    };

    performHandshake();
  }, [sessionId, setSessionId, setLoading]);

  return { sessionId };
}
