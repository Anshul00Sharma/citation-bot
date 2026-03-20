"use client";

import { useState, useRef, useEffect } from "react";
import { useUploadStore } from "@/store/useUploadStore";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

export default function ChatSection() {
  const { file } = useUploadStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    setHasStartedChat(true);

    // Add user message
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: userMsg }]);

    // Mock bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", content: `Here is a mocked AI response actively analyzing the document and addressing your query: "${userMsg}". This ensures fluid citation integrations later.` }
      ]);
    }, 1200);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="left-panel chat-container" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Chat Messages Area */}
      <div className={`chat-messages ${hasStartedChat ? 'active' : ''}`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`chat-input-wrapper ${hasStartedChat ? 'at-bottom' : 'centered'}`}>
        {!hasStartedChat && (
          <h2 className="chat-heading">Chat with Document</h2>
        )}
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask anything about ${file?.name || "the uploaded file"}...`}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
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
