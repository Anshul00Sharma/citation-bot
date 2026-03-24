"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { useUploadStore } from "@/store/useUploadStore";

const API_BASE_URL =
  "https://citation-bot-backend-983894129463.europe-west1.run.app";

export function useHandshake() {
  const { sessionId, setSessionId, setFileId, setLoading } = useSessionStore();
  const { setFile } = useUploadStore();
  
  // Use a ref to prevent double-fetching on React Strict Mode
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    const performHandshake = async () => {
      setLoading(true);
      try {
        let currentSessionId = sessionId;

        if (currentSessionId) {
          // 1. Fetch existing session data
          const userRes = await fetch(`${API_BASE_URL}/api/users/handshake?session_id=${encodeURIComponent(currentSessionId)}`);
          if (userRes.ok) {
             const userData = await userRes.json();
             console.log("[Handshake] Loaded existing session:", userData);
             
             if (userData.file_id) {
               setFileId(userData.file_id);
               // 2. Fetch the file data
               const fileRes = await fetch(`${API_BASE_URL}/api/files/?session_id=${encodeURIComponent(currentSessionId)}&file_id=${encodeURIComponent(userData.file_id)}`);
               if (fileRes.ok) {
                 const fileData = await fileRes.json();
                 if (Array.isArray(fileData.data) && fileData.data.length > 0) {
                   setFile({
                     name: "Uploaded Document",
                     type: "PDF Document",
                     size: fileData.data.join("").length,
                     fetchedData: fileData.data
                   });
                   console.log("[Handshake] Hydrated existing file data from API");
                 }
               }
             }
          } else {
            console.warn("[Handshake] Session not found, creating new one.");
            currentSessionId = null; // force fallback to create new
          }
        }

        if (!currentSessionId) {
          // Generate a new session
          const generateUUID = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
              return crypto.randomUUID();
            }
            // Fallback for non-secure contexts (e.g., local network IP without HTTPS)
            return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
              const r = Math.random() * 16 | 0;
              const v = c === '0' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };
          const newSessionId = generateUUID();
          
          const response = await fetch(`${API_BASE_URL}/api/users/handshake`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: newSessionId }),
          });

          if (!response.ok) {
            throw new Error(`Handshake failed with status ${response.status}`);
          }

          const data = await response.json();
          setSessionId(data.session_id);
          console.log("[Handshake] Session established:", data.session_id);
        }
      } catch (error) {
        console.error("[Handshake] Error:", error);
      } finally {
        setLoading(false);
      }
    };

    performHandshake();
  }, [sessionId, setSessionId, setFileId, setFile, setLoading]);

  return { sessionId };
}
