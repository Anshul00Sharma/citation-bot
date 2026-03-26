"use client";

import { useRef, useState, useEffect } from "react";
import { useUploadStore } from "@/store/useUploadStore";
import { useSessionStore } from "@/store/useSessionStore";

const LOADING_MESSAGES = [
  "Initializing secure connection.",
  "Constructing your workspace.",
  "Engaging Citation Bot."
];

export default function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setFile } = useUploadStore();
  const isLoading = useSessionStore((state) => state.isLoading);

  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isLoading) return;

    const currentMessage = LOADING_MESSAGES[messageIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayedText !== currentMessage) {
      timeout = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
      }, 50 + Math.random() * 30);
    } else if (!isDeleting && displayedText === currentMessage) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && displayedText !== "") {
      timeout = setTimeout(() => {
        setDisplayedText(displayedText.slice(0, -1));
      }, 25);
    } else if (isDeleting && displayedText === "") {
      setIsDeleting(false);
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      timeout = setTimeout(() => {}, 200); 
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, messageIndex, isLoading]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    const fileName = uploadedFile.name.toLowerCase();
    
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      setError("Please upload only .pdf, .txt, or .doc files.");
      return;
    }

    let format = "Unknown";
    if (fileName.endsWith('.pdf')) format = "PDF Document";
    else if (fileName.endsWith('.txt')) format = "Text File";
    else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) format = "Word Document";

    setFile({
      name: uploadedFile.name,
      type: format,
      size: uploadedFile.size,
      nativeFile: uploadedFile,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading) {
    return (
      <div 
        className="upload-section" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px',
          cursor: 'default'
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .animate-blink {
            animation: blink 1s step-end infinite;
          }
        `}} />
        <div className="flex h-10 items-center justify-center font-mono text-xl font-medium tracking-tight text-zinc-800">
          <span>{displayedText}</span>
          <span className="animate-blink ml-[2px] h-[1em] w-[2px] bg-zinc-800"></span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="upload-section"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleContainerClick}
      style={{ 
        borderColor: isDragging ? 'var(--neon-green)' : '',
        transform: isDragging ? 'scale(1.02)' : ''
      }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".txt,.pdf,.doc,.docx" 
        style={{ display: 'none' }}
      />

      <div className="upload-icon" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="2" width="16" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="upload-title" style={{ textAlign: 'center' }}>Drop your documents here</h2>
      <p className="upload-subtitle" style={{ textAlign: 'center' }}>Click to browse or drag and drop</p>
      
      {error && (
        <p style={{ marginTop: '1.5rem', color: '#ff4757', fontWeight: '600', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div className="file-types" style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '1.5rem', marginTop: '2.5rem' }}>
        <span className="file-badge txt">.TXT</span>
        <span className="file-badge pdf">.PDF</span>
        <span className="file-badge doc">.DOC</span>
      </div>
    </div>
  );
}
