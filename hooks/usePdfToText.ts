import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useSessionStore } from '@/store/useSessionStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const API_BASE_URL =
  'https://citation-bot-backend-983894129463.europe-west1.run.app';

async function uploadFileData(sessionId: string, fileId: string, data: string[]) {
  const payload = { data: data };
  console.log("=== API REQUEST PAYLOAD ===");
  console.log("URL:", `${API_BASE_URL}/api/files/?session_id=${encodeURIComponent(sessionId)}&file_id=${encodeURIComponent(fileId)}`);
  console.log("Body:", JSON.stringify(payload, null, 2));
  console.log("===========================");

  const response = await fetch(
    `${API_BASE_URL}/api/files/?session_id=${encodeURIComponent(sessionId)}&file_id=${encodeURIComponent(fileId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`File upload failed with status ${response.status}`);
  }

  return response.json();
}

export function usePdfToText(file: File | null) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [error, setError] = useState<string | null>(null);
  const [extractedPages, setExtractedPages] = useState<string[]>([]);
  const { sessionId, setFileId } = useSessionStore();

  useEffect(() => {
    if (!file || file.type !== "application/pdf") {
      setExtractedPages([]);
      return;
    }

    let isCancelled = false;

    async function extractText() {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setExtractedPages([]);

      try {
        const arrayBuffer = await file!.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const numPages = Math.min(pdf.numPages, 10); // Max 10 pages
        const pageTexts: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          if (isCancelled) break;

          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          pageTexts.push(pageText);

          setProgress(Math.round((i / numPages) * 100));
        }

        if (!isCancelled) {
          setExtractedPages(pageTexts);
          
          if (sessionId && pageTexts.length > 0) {
            const generateUUID = () => {
              if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
              }
              return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === '0' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            };
            const fileId = generateUUID();
            await uploadFileData(sessionId, fileId, pageTexts);
            setFileId(fileId);
            console.log('[Upload] File data sent to backend:', fileId);
          }
        }

      } catch (err: any) {
        if (!isCancelled) setError(err.message || 'Error parsing PDF');
      } finally {
        if (!isCancelled) setIsProcessing(false);
      }
    }

    extractText();

    return () => {
      isCancelled = true;
    };
  }, [file, sessionId, setFileId]);

  return { isProcessing, progress, error, extractedPages };
}
