"use client";

import { useUploadStore } from "@/store/useUploadStore";
import dynamic from "next/dynamic";
import ChatSection from "./ChatSection";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { 
  ssr: false, 
  loading: () => <div style={{ color: 'var(--neon-green)' }}>Loading Document Viewer...</div> 
});

export default function SplitScreenView() {
  const { file, setFile } = useUploadStore();

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  if (!file) return null;

  return (
    <>
      <ChatSection />

      <div className="upload-section upload-section-shifted">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', height: '100%' }}>
          {file.type === "PDF Document" ? (
            <PdfViewer nativeFile={file.nativeFile} />
          ) : (
            <>
              <div className="upload-icon" style={{ display: 'flex', justifyContent: 'center', width: '100%', color: 'var(--neon-blue)' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.8s' }}>
                  <rect x="4" y="2" width="16" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="upload-title" style={{ color: 'var(--neon-green)' }}>File Uploaded!</h2>
              <p className="upload-subtitle" style={{ marginTop: '0.5rem', color: 'white', fontWeight: '500', wordBreak: 'break-all' }}>
                {file.name}
              </p>
              <p style={{ color: '#aaaaaa', marginTop: '0.25rem', fontSize: '0.8rem' }}>{file.type}</p>
              
              <button 
                onClick={handleRemoveFile}
                className="remove-btn"
              >
                Upload Another File
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
