"use client";

import { useRef, useState } from "react";
import { useUploadStore } from "@/store/useUploadStore";

export default function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setFile } = useUploadStore();

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
