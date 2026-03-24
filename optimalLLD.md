# Citation Bot — Optimal Low-Level Design (LLD)

> **Based on:** Current implementation as of March 2026
> **Goal:** Evolve the existing codebase into a production-grade, maintainable, and scalable architecture while preserving the current feature set and design language.

---

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Browser (Client)                                   │
│                                                                                  │
│   Next.js 16 (App Router)                                                        │
│   ┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────────────────┐  │
│   │  Zustand   │  │  IndexedDB   │  │  session-  │  │  React Error Boundaries  │  │
│   │  Stores    │  │  (PDF +      │  │  Storage   │  │  + Toast Notifications   │  │
│   │  (slices)  │  │   Chat Cache)│  │            │  │                          │  │
│   └───────────┘  └──────────────┘  └───────────┘  └──────────────────────────┘  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │                        Service Layer (api/)                             │    │
│   │  sessionService.ts  │  fileService.ts  │  chatService.ts               │    │
│   └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                              │  HTTP (REST) + WebSocket (chat streaming)
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Backend (Python FastAPI — Cloud Run)                         │
│                                                                                  │
│   /api/users/handshake     (POST/GET)                                            │
│   /api/files/              (POST/GET)                                            │
│   /api/chats/              (POST/GET)  ← real Gemini AI                         │
│   /ws/chats/               (WebSocket) ← streaming responses (future)           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Optimal Directory Structure

```
citation-bot/
├── app/
│   ├── layout.tsx                  # Root layout — Providers, Font, Error Boundary
│   ├── page.tsx                    # Home page
│   ├── globals.css                 # Design tokens + base resets only
│   ├── error.tsx                   # [NEW] App-level error boundary
│   ├── loading.tsx                 # [NEW] App-level loading skeleton
│   └── favicon.ico
│
├── components/
│   ├── layout/                     # [NEW] Layout-level components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MainContent.tsx
│   │
│   ├── upload/                     # [NEW] Upload feature components
│   │   ├── UploadDropzone.tsx
│   │   ├── UploadDropzone.module.css
│   │   └── FileInfoCard.tsx        # [NEW] Extracted from SplitScreenView
│   │
│   ├── viewer/                     # [NEW] Document viewer components
│   │   ├── PdfViewer.tsx
│   │   ├── PdfViewer.module.css
│   │   ├── PageThumbnail.tsx       # [NEW] Extracted from PdfViewer
│   │   ├── SearchBar.tsx           # [NEW] Extracted from PdfViewer
│   │   └── TextViewer.tsx          # [NEW] .txt file viewer
│   │
│   ├── chat/                       # [NEW] Chat feature components
│   │   ├── ChatSection.tsx
│   │   ├── ChatSection.module.css
│   │   ├── ChatBubble.tsx          # [NEW] Extracted
│   │   ├── ChatInput.tsx           # [NEW] Extracted
│   │   └── TypingIndicator.tsx     # [NEW] Loading dots during AI response
│   │
│   ├── providers/                  # [NEW] Provider components
│   │   ├── SessionProvider.tsx
│   │   └── ErrorBoundary.tsx       # [NEW] Reusable error boundary
│   │
│   └── ui/                         # [NEW] Shared presentational components
│       ├── Toast.tsx               # [NEW] Toast notification component
│       ├── ProgressBar.tsx         # [NEW] Reusable progress bar
│       └── Spinner.tsx             # [NEW] Loading spinner
│
├── services/                       # [NEW] API service layer
│   ├── apiClient.ts                # [NEW] Base HTTP client with error handling
│   ├── sessionService.ts           # [NEW] Handshake API calls
│   ├── fileService.ts              # [NEW] File upload/retrieve API calls
│   └── chatService.ts              # [NEW] Chat send/history API calls
│
├── hooks/
│   ├── useHandshake.ts             # Session initialization
│   ├── usePdfToText.ts             # PDF extraction + upload
│   ├── useChatMessages.ts          # [NEW] Chat logic with real API
│   ├── useSearchDocument.ts        # [NEW] Extracted document search logic
│   └── useToast.ts                 # [NEW] Toast notification management
│
├── store/
│   ├── useSessionStore.ts          # Session & file ID
│   ├── useUploadStore.ts           # Upload state
│   └── useChatStore.ts             # [NEW] Chat messages + history cache
│
├── lib/                            # [NEW] Utility functions
│   ├── storage.ts                  # [NEW] IndexedDB abstraction layer
│   ├── validators.ts               # [NEW] File validation utilities
│   └── constants.ts                # [NEW] API URLs, limits, magic numbers
│
├── types/                          # [NEW] Shared TypeScript definitions
│   ├── message.ts
│   ├── page.ts
│   ├── file.ts
│   └── api.ts
│
├── styles/                         # [NEW] Modular CSS
│   ├── tokens.css                  # Design tokens only
│   ├── animations.css              # All @keyframes
│   ├── layout.css                  # Container, grid, flex utilities
│   └── components.css              # Base component styles
│
├── __tests__/                      # [NEW] Test directory
│   ├── components/
│   ├── hooks/
│   └── services/
│
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
├── styleguide.md
├── techguide.md
└── API_DOCS.md
```

---

## 3. Optimal Component Architecture

### 3.1 Component Tree

```
RootLayout (Server)
 ├── Font Provider (Montserrat)
 ├── ErrorBoundary (Client)                    ← [NEW] catches render errors
 │    └── SessionProvider (Client)
 │         ├── Toast (Client)                  ← [NEW] global toast container
 │         └── Home (Server)
 │              ├── Header (Client)
 │              ├── MainContent (Client)
 │              │    ├── [no file] UploadDropzone
 │              │    └── [file]   SplitScreenView
 │              │         ├── ChatSection
 │              │         │    ├── ChatBubble (×N)       ← [NEW] extracted
 │              │         │    ├── TypingIndicator        ← [NEW]
 │              │         │    └── ChatInput              ← [NEW] extracted
 │              │         └── DocumentPanel
 │              │              ├── [PDF]  PdfViewer
 │              │              │    ├── SearchBar          ← [NEW] extracted
 │              │              │    └── PageThumbnail (×N) ← [NEW] extracted
 │              │              ├── [TXT]  TextViewer       ← [NEW]
 │              │              └── [DOC]  FileInfoCard     ← [NEW] extracted
 │              └── Footer (Server)
```

### 3.2 Key Component Changes

#### `ChatSection` — Real AI Integration
```typescript
// hooks/useChatMessages.ts
interface UseChatMessagesReturn {
  messages: Message[];
  isLoading: boolean;           // NEW: AI is generating response
  error: string | null;         // NEW: error state
  sendMessage: (text: string) => Promise<void>;
  loadHistory: () => Promise<void>;  // NEW: load from backend
}

function useChatMessages(sessionId: string | null): UseChatMessagesReturn {
  // 1. On mount → GET /api/chats/?session_id=X → populate messages
  // 2. On send → POST /api/chats/ → add user msg → add AI response
  // 3. Cache in useChatStore for persistence across re-renders
  // 4. Error handling with toast notifications
}
```

#### `PdfViewer` — Decomposed
```
PdfViewer (container)
 ├── SearchBar                    ← extracted: search form + status
 ├── PageMainView                 ← page content area with highlight rendering
 └── ThumbnailStrip
      └── PageThumbnail (×N)     ← extracted: individual thumbnail card
```

#### `ErrorBoundary` — Global + Per-Feature
```typescript
// components/providers/ErrorBoundary.tsx
// Wraps the entire app — catches unhandled render errors
// Shows a friendly error screen with "Retry" button

// Also used locally:
// <ErrorBoundary fallback={<PdfErrorCard />}>
//   <PdfViewer nativeFile={file.nativeFile} />
// </ErrorBoundary>
```

---

## 4. Optimal State Management

### 4.1 Zustand Stores

#### `useSessionStore` (enhanced)
```typescript
interface SessionStore {
  sessionId: string | null;
  fileId: string | null;
  isLoading: boolean;
  error: string | null;                // [NEW] handshake error state
  setSessionId: (id: string) => void;
  setFileId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;  // [NEW]
  reset: () => void;                   // [NEW] clear session
}
```

#### `useUploadStore` (enhanced)
```typescript
interface UploadedFile {
  name: string;
  type: string;
  size: number;
  mimeType: string;             // [NEW] actual MIME type
  nativeFile: File;
  uploadedAt: number;           // [NEW] timestamp
}

interface UploadStore {
  file: UploadedFile | null;
  isUploading: boolean;         // [NEW] upload-to-backend status
  uploadError: string | null;   // [NEW] upload error
  setFile: (file: UploadedFile | null) => void;
  setUploading: (v: boolean) => void;
  setUploadError: (e: string | null) => void;
}
```

#### `useChatStore` — [NEW]
```typescript
interface ChatStore {
  messages: Message[];
  isAiResponding: boolean;          // typing indicator
  hasLoadedHistory: boolean;        // prevent duplicate history loads
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setAiResponding: (v: boolean) => void;
  clearMessages: () => void;
}
```

### 4.2 State Flow Diagram

```
                    ┌─────────────────┐
                    │  sessionStorage  │
                    │   (session_id)   │
                    └────────┬────────┘
                             │ hydrate on load
                    ┌────────▼────────┐
                    │ useSessionStore  │
                    │  sessionId       │◄──── useHandshake (on mount)
                    │  fileId          │◄──── usePdfToText (after extraction)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐  ┌───▼─────────┐  ┌▼────────────┐
     │ useUploadStore │  │ useChatStore │  │  IndexedDB   │
     │  file          │  │  messages    │  │  PDF pages   │
     │  isUploading   │  │  isRespond.  │  │  (cached)    │
     └───────────────┘  └─────────────┘  └──────────────┘
```

---

## 5. Service Layer — [NEW]

### 5.1 API Client

```typescript
// services/apiClient.ts
import { API_BASE_URL } from '@/lib/constants';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }

  async post<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }
}

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`API Error ${status}: ${detail}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### 5.2 Service Modules

```typescript
// services/sessionService.ts
export const sessionService = {
  handshake: (sessionId: string) =>
    apiClient.post<HandshakeResponse>('/api/users/handshake', { session_id: sessionId }),

  getUser: (sessionId: string) =>
    apiClient.get<HandshakeResponse>('/api/users/handshake', { session_id: sessionId }),
};

// services/fileService.ts
export const fileService = {
  uploadFileData: (sessionId: string, fileId: string, data: string[]) =>
    apiClient.post<{ message: string }>('/api/files/', { data }, { session_id: sessionId, file_id: fileId }),

  getFileData: (sessionId: string, fileId: string) =>
    apiClient.get<FileDataResponse>('/api/files/', { session_id: sessionId, file_id: fileId }),
};

// services/chatService.ts
export const chatService = {
  sendMessage: (sessionId: string, message: string) =>
    apiClient.post<ChatMessageResponse>('/api/chats/', { session_id: sessionId, message }),

  getChatHistory: (sessionId: string) =>
    apiClient.get<ChatMessageResponse[]>('/api/chats/', { session_id: sessionId }),
};
```

---

## 6. Optimal Data Flow

### 6.1 Chat Flow (Real AI — Connected)

```
User types message
   │
   ▼
ChatInput.handleSubmit()
   │
   ▼
useChatMessages.sendMessage(text)
   │
   ├── 1. Add user message to useChatStore.messages
   ├── 2. Set isAiResponding = true → show TypingIndicator
   │
   ▼
chatService.sendMessage(sessionId, text)
   │  POST /api/chats/ { session_id, message }
   │
   ▼
Backend processes with Gemini AI
   │
   ▼
Response received
   │
   ├── 3. Add AI message to useChatStore.messages
   ├── 4. Set isAiResponding = false → hide TypingIndicator
   │
   ▼
Auto-scroll to latest message

   On Error:
   ├── Show toast notification: "Failed to get response. Retry?"
   ├── Set isAiResponding = false
   └── User can retry the same message
```

### 6.2 Chat History Recovery

```
SplitScreenView mounts
   │
   ▼
useChatMessages.loadHistory()
   │
   ├── Check useChatStore.hasLoadedHistory
   │     YES → skip
   │     NO  ▼
   │
   ▼
chatService.getChatHistory(sessionId)
   │  GET /api/chats/?session_id=X
   │
   ▼
Set messages in useChatStore
Set hasLoadedHistory = true
```

### 6.3 Enhanced File Upload Flow

```
User drops/selects file
   │
   ▼
UploadDropzone.validateAndSetFile()
   │
   ├── Check file extension (validators.ts)
   ├── Check file size (< MAX_FILE_SIZE from constants.ts)     ← [NEW]
   │
   ▼
useUploadStore.setFile(...)
   │
   ▼
MainContent → SplitScreenView
   │
   ├── PDF?
   │     ├── PdfViewer → usePdfToText()
   │     │     ├── Extract (max pages from constants)
   │     │     ├── Cache to IndexedDB via storage.ts
   │     │     ├── Upload to backend via fileService.ts       ← [NEW: uses service]
   │     │     └── Error → toast notification                 ← [NEW: user-visible]
   │     └── Load pages from IndexedDB → render
   │
   ├── TXT?                                                    ← [NEW]
   │     └── TextViewer
   │           ├── Read file via FileReader API
   │           ├── Cache to IndexedDB
   │           └── Upload to backend
   │
   └── DOC/DOCX?
         └── FileInfoCard (info only, no extraction yet)
```

---

## 7. IndexedDB Abstraction — [NEW]

```typescript
// lib/storage.ts
const DB_NAME = 'CitationBotDB';
const DB_VERSION = 2;  // bumped for new stores

const STORES = {
  PDF_PAGES: 'PdfPagesStore',
  TEXT_FILES: 'TextFilesStore',    // [NEW]
} as const;

class StorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          for (const storeName of Object.values(STORES)) {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  async put<T extends { id: string }>(storeName: string, record: T): Promise<void> { ... }
  async getAll<T>(storeName: string): Promise<T[]> { ... }
  async getByKey<T>(storeName: string, key: string): Promise<T | undefined> { ... }
  async deleteByKey(storeName: string, key: string): Promise<void> { ... }
  async clearStore(storeName: string): Promise<void> { ... }   // eviction support
}

export const storage = new StorageManager();
```

---

## 8. Constants & Configuration — [NEW]

```typescript
// lib/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://citation-bot-backend-983894129463.europe-west1.run.app';

export const MAX_PDF_PAGES = 10;
export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'] as const;

export const CHAT_MOCK_DELAY_MS = 1200;  // only used if mock mode

export const FILE_TYPE_LABELS: Record<string, string> = {
  '.pdf': 'PDF Document',
  '.txt': 'Text File',
  '.doc': 'Word Document',
  '.docx': 'Word Document',
};
```

---

## 9. Shared Type Definitions — [NEW]

```typescript
// types/message.ts
export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'ai';    // aligned with backend naming
  content: string;
  created_at: string;       // ISO timestamp from backend
}

// types/page.ts
export interface PageData {
  id: string;
  filename: string;
  pageIndex: number;
  text: string;
}

// types/file.ts
export interface UploadedFile {
  name: string;
  type: string;
  mimeType: string;
  size: number;
  nativeFile: File;
  uploadedAt: number;
}

// types/api.ts
export interface HandshakeResponse {
  session_id: string;
  created_at: string;
  name: string | null;
  file_id: string | null;
  chat_room_id: string | null;
}

export interface FileDataResponse {
  session_id: string;
  file_id: string;
  data: string[];
}

export interface ChatMessageResponse {
  session_id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}
```

---

## 10. Styling Architecture — Modularized

### 10.1 Split CSS into Modules

| Current | Optimal |
|---------|---------|
| `globals.css` (517 lines, everything) | `globals.css` (~50 lines: resets + token imports) |
| — | `styles/tokens.css` — Design tokens only |
| — | `styles/animations.css` — All `@keyframes` |
| — | `styles/layout.css` — Container, grid utilities |
| — | `*.module.css` per component — scoped styles |

### 10.2 CSS Modules for Components

```css
/* components/chat/ChatSection.module.css */
.container { ... }
.messages { ... }
.bubble { ... }
.bubbleUser { composes: bubble; ... }
.bubbleBot { composes: bubble; ... }
.inputWrapper { ... }
.inputCentered { composes: inputWrapper; ... }
.inputBottom { composes: inputWrapper; ... }
```

**Benefits:**
- No class name collisions
- Tree-shaking removes unused styles
- Co-located with components
- Styles scoped locally by default

---

## 11. Error Handling Strategy — [NEW]

### 11.1 Error Layers

```
Layer 1: ApiClient (services/apiClient.ts)
   └── Throws typed ApiError with status + detail

Layer 2: Hooks (hooks/*)
   └── Catches ApiError, updates local error state
   └── Triggers toast notification for user-facing errors

Layer 3: ErrorBoundary (components/providers/ErrorBoundary.tsx)
   └── Catches unhandled render errors
   └── Shows friendly "Something went wrong" UI with retry

Layer 4: Next.js error.tsx
   └── App-level error page for unrecoverable errors
```

### 11.2 Toast Notification System

```typescript
// hooks/useToast.ts
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;    // auto-dismiss ms
}

// Usage in hooks:
const { showToast } = useToast();

try {
  await chatService.sendMessage(sessionId, text);
} catch (err) {
  showToast({ type: 'error', message: 'Failed to send message. Please try again.' });
}
```

---

## 12. Enhanced Search — [NEW]

```typescript
// hooks/useSearchDocument.ts
interface UseSearchDocumentReturn {
  query: string;
  setQuery: (q: string) => void;
  status: 'idle' | 'found' | 'not_found';
  matchCount: number;              // [NEW] total matches
  currentMatch: number;            // [NEW] which match we're viewing
  matchedPageIndex: number | null;
  executeSearch: () => void;
  nextMatch: () => void;           // [NEW] navigate to next match
  previousMatch: () => void;       // [NEW] navigate to previous match
  clearSearch: () => void;
}
```

**Improvements over current:**
- Highlights **all** occurrences, not just the first
- "Next/Previous" match navigation
- Match count display: "3 of 12 matches"
- Cross-page navigation for matches
- Extracted from PdfViewer → reusable hook

---

## 13. Testing Strategy — [NEW]

```
__tests__/
├── components/
│   ├── UploadDropzone.test.tsx      # file validation, drag events
│   ├── ChatSection.test.tsx         # message send, display, loading
│   └── PdfViewer.test.tsx           # page nav, search, highlight
├── hooks/
│   ├── useHandshake.test.ts         # API call, session storage
│   ├── usePdfToText.test.ts         # extraction, upload, error cases
│   └── useChatMessages.test.ts      # send, history, error
└── services/
    ├── apiClient.test.ts            # HTTP methods, error handling
    └── chatService.test.ts          # endpoint calls, response parsing
```

**Tooling:**
- **Vitest** — unit test runner (fast, ESM-native)
- **React Testing Library** — component testing
- **MSW (Mock Service Worker)** — API mocking in tests
- **Playwright** — E2E tests for critical flows (upload → chat → search)

---

## 14. Responsive Design — [NEW]

```css
/* Breakpoints */
/* Mobile:  < 768px — single column, full-width chat/viewer toggle */
/* Tablet:  768px - 1024px — stacked layout with reduced margins */
/* Desktop: > 1024px — current split-screen layout */

@media (max-width: 768px) {
  .container-split {
    flex-direction: column;
    gap: 0;
  }

  /* Tab-based toggle between Chat and Viewer */
  .mobile-tab-bar {
    display: flex;
    position: sticky;
    top: 0;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container-split {
    width: 98%;
    gap: 1.5rem;
  }
}
```

---

## 15. Environment Configuration — [NEW]

```typescript
// next.config.ts (enhanced)
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config) => {
    // Bundle pdfjs worker locally instead of CDN
    config.resolve.alias['pdfjs-dist/build/pdf.worker.min.mjs'] = 
      require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
    return config;
  },
};
```

**Environment Variables:**
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# .env.production
NEXT_PUBLIC_API_URL=https://citation-bot-backend-983894129463.europe-west1.run.app
```

---

## 16. Migration Priority (Current → Optimal)

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 **P0** | Connect `ChatSection` to real backend API | Medium | Core feature completion |
| 🔴 **P0** | Add error handling with toast notifications | Medium | User experience |
| 🟡 **P1** | Extract service layer from hooks | Low | Code maintainability |
| 🟡 **P1** | Add `useChatStore` for message persistence | Low | No lost chat on re-render |
| 🟡 **P1** | Environment variables for API URL | Low | Dev/prod flexibility |
| 🟡 **P1** | Bundle pdfjs worker locally | Low | Remove CDN dependency |
| 🟢 **P2** | Decompose `PdfViewer` into sub-components | Medium | Code maintainability |
| 🟢 **P2** | CSS Modules per component | Medium | Style isolation |
| 🟢 **P2** | Centralize types in `types/` | Low | Type safety |
| 🟢 **P2** | Constants file for magic numbers | Low | Configurability |
| 🟢 **P2** | Add `TextViewer` for .txt files | Low | Feature completion |
| 🔵 **P3** | Responsive/mobile layout | High | Mobile support |
| 🔵 **P3** | Enhanced search (multi-match nav) | Medium | Feature improvement |
| 🔵 **P3** | Unit tests (Vitest + RTL) | High | Code reliability |
| 🔵 **P3** | E2E tests (Playwright) | High | Regression prevention |
| 🔵 **P3** | IndexedDB eviction policy | Low | Storage management |
| ⚪ **P4** | WebSocket streaming for AI responses | High | Premium UX |
| ⚪ **P4** | File size validation | Low | Safety |

---

## 17. Comparison Summary

| Aspect | Current | Optimal |
|--------|---------|---------|
| **Chat AI** | Mocked (setTimeout) | Real Gemini API connected |
| **Error Handling** | `console.error` only | Toast notifications + ErrorBoundary |
| **API Calls** | Inline in hooks | Dedicated service layer |
| **Chat Persistence** | Component local state (lost) | Zustand store + backend history |
| **CSS** | Single 517-line file | Modular: tokens + CSS Modules |
| **Component Count** | 8 flat components | ~18 organized in feature dirs |
| **Types** | Inline interfaces | Centralized `types/` directory |
| **Config** | Hardcoded URLs/limits | `.env` + `constants.ts` |
| **pdfjs Worker** | CDN (unpkg.com) | Bundled locally |
| **Tests** | None | Vitest + RTL + Playwright |
| **Mobile** | Not supported | Responsive breakpoints |
| **File Search** | First match only | Multi-match with navigation |
| **txt/doc Support** | Info card only | TextViewer + future doc parser |
