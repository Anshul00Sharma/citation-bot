import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useSessionStore } from '@/store/useSessionStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const API_BASE_URL =
  'https://citation-bot-backend-983894129463.europe-west1.run.app';

const DB_NAME = 'CitationBotDB';
const STORE_NAME = 'PdfPagesStore';
const DB_VERSION = 1;

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function savePageToDB(db: IDBDatabase, id: string, filename: string, pageIndex: number, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, filename, pageIndex, text });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getPdfPagesFromDB(filename: string): Promise<{id: string, filename: string, pageIndex: number, text: string}[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allPages = request.result;
        const filePages = allPages
          .filter((page: any) => page.filename === filename)
          .sort((a: any, b: any) => a.pageIndex - b.pageIndex);
        resolve(filePages);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

async function uploadFileData(sessionId: string, fileId: string, data: string[]) {
  const response = await fetch(
    `${API_BASE_URL}/api/files/?session_id=${encodeURIComponent(sessionId)}&file_id=${encodeURIComponent(fileId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
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
  const { sessionId, setFileId } = useSessionStore();

  useEffect(() => {
    if (!file || file.type !== "application/pdf") return;

    let isCancelled = false;

    async function extractText() {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const db = await initDB();
        const arrayBuffer = await file!.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const numPages = Math.min(pdf.numPages, 10); // Max 10 pages
        const pageTexts: string[] = [];
        
        for (let i = 1; i <= numPages; i++) {
          if (isCancelled) break;
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // pdfjs returns text items. We join them to form the text of the page.
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          pageTexts.push(pageText);
          
          const rowId = `${file!.name}_page_${i}`;
          await savePageToDB(db, rowId, file!.name, i, pageText);
          
          setProgress(Math.round((i / numPages) * 100));
        }

        // After extraction, send the text array to the backend
        if (!isCancelled && sessionId && pageTexts.length > 0) {
          const fileId = crypto.randomUUID();
          await uploadFileData(sessionId, fileId, pageTexts);
          setFileId(fileId);
          console.log('[Upload] File data sent to backend:', fileId);
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

  return { isProcessing, progress, error };
}
