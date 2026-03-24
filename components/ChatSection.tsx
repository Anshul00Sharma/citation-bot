"use client";

import { useState, useRef, useEffect } from "react";
import { useUploadStore } from "@/store/useUploadStore";
import { useSearchStore } from "@/store/useSearchStore";
import { useChat } from "@/hooks/useChat";

export default function ChatSection() {
  const { file } = useUploadStore();
  const { triggerSearch } = useSearchStore();
  const { messages, sendMessage, isSending, isLoadingHistory, error } = useChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasStartedChat = messages.length > 0;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    await sendMessage(userMsg);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Check latest message for citation
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      // Only process AI messages that just arrived
      if (latestMessage.sender === "ai") {
        if (latestMessage.have_citation && latestMessage.citation) {
           triggerSearch(latestMessage.citation);
        } else if (latestMessage.have_citation === false) {
           showToast("No citation for this AI reply");
        }
      }
    }
  }, [messages, triggerSearch]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="left-panel chat-container" style={{ position: 'relative', overflow: 'hidden' }}>

      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4757',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          animation: 'fadeInOut 3s forwards'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Chat Messages Area */}
      <div className={`chat-messages ${hasStartedChat ? 'active' : ''}`}>
        {isLoadingHistory && (
          <div style={{ textAlign: 'center', opacity: 0.7, padding: '1rem' }}>
            Loading chat history...
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender === "ai" ? "bot" : "user"}`}>
            <div>{msg.message}</div>
            {msg.sender === "ai" && msg.have_citation && msg.citation && (
              <button 
                onClick={() => triggerSearch(msg.citation!)}
                style={{
                  marginTop: '8px',
                  background: 'rgba(57, 255, 20, 0.15)',
                  border: '1px solid var(--neon-green)',
                  color: 'var(--neon-green)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                View Citation
              </button>
            )}
          </div>
        ))}
        
        {isSending && (
           <div className="chat-bubble bot" style={{ opacity: 0.6 }}>
             Typing...
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`chat-input-wrapper ${hasStartedChat ? 'at-bottom' : 'centered'}`}>
        {!hasStartedChat && !isLoadingHistory && (
          <h2 className="chat-heading">Chat with Document</h2>
        )}
        
        {error && (
          <div style={{ color: '#ff4757', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isSending ? "Sending..." : `Ask anything about ${file?.name || "the uploaded file"}...`}
            disabled={isSending}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() || isSending}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}
