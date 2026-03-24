# Citation Bot — Current Low-Level Design (LLD)

> **Snapshot as of:** March 2026
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Zustand · pdfjs-dist · IndexedDB · TailwindCSS (v4) · Montserrat Font

---

## 1. System Context

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                            │
│                                                                      │
│   Next.js 16 App (App Router, SSR + CSR)                            │
│   ┌─────────┐  ┌──────────────┐  ┌──────────────────────┐          │
│   │ Zustand  │  │  IndexedDB   │  │  sessionStorage      │          │
│   │ Stores   │  │  (PDF Cache) │  │  (session_id)        │          │
│   └─────────┘  └──────────────┘  └──────────────────────┘          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                         │  HTTP (REST)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Backend (Python FastAPI — Google Cloud Run)              │
│              https://citation-bot-backend-*.run.app                   │
│                                                                      │
│   /api/users/handshake   (POST/GET)                                  │
│   /api/files/            (POST/GET)                                  │
│   /api/chats/            (POST/GET)                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
citation-bot/
├── app/
│   ├── layout.tsx          # Root layout — Montserrat font, SessionProvider wrapper
│   ├── page.tsx            # Home page — Header + MainContent + Footer
│   ├── globals.css         # All CSS (~517 lines) — design tokens, animations, components
│   └── favicon.ico
├── components/
│   ├── SessionProvider.tsx  # Wrapper that triggers useHandshake on app mount
│   ├── Header.tsx           # "Citation Bot" title with animated/shifted states
│   ├── Footer.tsx           # Static copyright footer
│   ├── MainContent.tsx      # Conditional renderer: UploadDropzone OR SplitScreenView
│   ├── UploadDropzone.tsx   # Drag-and-drop file upload with validation
│   ├── SplitScreenView.tsx  # Two-panel layout: ChatSection + PdfViewer/FileInfo
│   ├── ChatSection.tsx      # Chat UI with local mock AI responses
│   └── PdfViewer.tsx        # Page-by-page text viewer with search + highlight
├── hooks/
│   ├── useHandshake.ts      # Session initialization via backend API
│   └── usePdfToText.ts      # PDF text extraction + IndexedDB storage + backend upload
├── store/
│   ├── useSessionStore.ts   # Zustand store: sessionId, fileId, isLoading
│   └── useUploadStore.ts    # Zustand store: uploaded file metadata
├── public/                  # Static assets (SVG icons)
├── package.json
├── next.config.ts
├── tsconfig.json
├── styleguide.md
├── techguide.md
└── API_DOCS.md
```

---

## 3. Component Architecture

### 3.1 Component Tree

```
RootLayout (Server Component)
 ├── Montserrat Font Provider
 └── SessionProvider (Client)           ← triggers useHandshake()
      └── Home (Server Component)
           ├── Header (Client)          ← reads useUploadStore.file for shift state
           ├── MainContent (Client)     ← conditional rendering gate
           │    ├── [if no file] UploadDropzone (Client)
           │    └── [if file]   SplitScreenView (Client)
           │         ├── ChatSection (Client)
           │         └── upload-section-shifted
           │              ├── [if PDF]  PdfViewer (Client, dynamic import, SSR: false)
           │              └── [if !PDF] Static file info card + "Upload Another"
           └── Footer (Server Component)
```

### 3.2 Component Details

#### `SessionProvider`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component (wrapper) |
| **Purpose** | Invokes `useHandshake()` on mount to establish a backend session |
| **Children** | Passes through `{children}` unchanged |
| **Side Effects** | Triggers API call `POST /api/users/handshake` |

#### `Header`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component |
| **State Dependency** | `useUploadStore.file` |
| **Behavior** | When `file` is null → centered, large, floating animation. When `file` exists → top-left, scaled to 60%, no animation |
| **CSS Classes** | `.title-wrapper`, `.title-shifted`, `.title-text` |

#### `MainContent`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component |
| **Role** | Conditional gate — renders `UploadDropzone` when no file, `SplitScreenView` when file is uploaded |
| **Layout** | `.container` → single column (max 800px). `.container-split` → flex row (max 1600px, 95% width) |

#### `UploadDropzone`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component |
| **Local State** | `isDragging: boolean`, `error: string | null` |
| **File Validation** | Accepts `.pdf`, `.txt`, `.doc`, `.docx` |
| **Input Methods** | Drag-and-drop (`onDragOver/Leave/Drop`), Click-to-browse (hidden `<input type="file">`) |
| **Side Effect** | On valid file → calls `useUploadStore.setFile({ name, type, size, nativeFile })` |
| **Error Handling** | Displays inline error for invalid file types |

#### `SplitScreenView`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component |
| **Layout** | Flex row — left: `ChatSection`, right: upload-section-shifted |
| **PDF Branch** | Dynamically imports `PdfViewer` with `ssr: false` |
| **Non-PDF Branch** | Shows file info (name, type) + "Upload Another File" button |
| **Remove File** | Calls `useUploadStore.setFile(null)` → returns to UploadDropzone |

#### `ChatSection`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component |
| **Local State** | `messages: Message[]`, `inputValue: string`, `hasStartedChat: boolean` |
| **Message Interface** | `{ id: string, role: "user" | "bot", content: string }` |
| **AI Integration** | **Currently mocked** — `setTimeout` returns a hardcoded response after 1200ms |
| **Layout Behavior** | Input starts centered vertically. On first message → moves to bottom. Messages area becomes visible (`opacity: 0 → 1`) |
| **Scrolling** | `useEffect` scrolls to `messagesEndRef` on message changes |

#### `PdfViewer`
| Aspect | Detail |
|--------|--------|
| **Type** | Client Component (dynamically imported, no SSR) |
| **Props** | `nativeFile: File` (the native browser File object) |
| **Data Source** | `usePdfToText()` for extraction → `getPdfPagesFromDB()` for retrieval |
| **Local State** | `pages: PageData[]`, `currentPageIndex`, `displayPageIndex`, `isTransitioning`, search states |
| **Page Navigation** | Click thumbnail → 300ms fade transition → update display page |
| **Search Feature** | Exact text search across all pages. Finds first match → navigates to page → highlights with marker animation |
| **Highlight Rendering** | `renderHighlightedText()` splits text at first match, wraps in `<span class="marker-highlight">` |
| **Loading State** | Progress bar during PDF extraction |

---

## 4. State Management

### 4.1 Global State (Zustand)

#### `useSessionStore`
```typescript
interface SessionStore {
  sessionId: string | null;      // Persisted to sessionStorage
  fileId: string | null;         // Set after backend file upload
  isLoading: boolean;            // Loading state during handshake
  setSessionId: (id: string) => void;
  setFileId: (id: string) => void;
  setLoading: (loading: boolean) => void;
}
```
- **Persistence**: `sessionId` is initialized from `sessionStorage.getItem('session_id')` and saved on every `setSessionId()` call
- **SSR Safety**: Guarded with `typeof window !== 'undefined'`

#### `useUploadStore`
```typescript
interface UploadedFile {
  name: string;          // Original filename
  type: string;          // Formatted type label: "PDF Document", "Text File", "Word Document"
  size: number;          // File size in bytes
  nativeFile: File;      // Native browser File object
}

interface UploadStore {
  file: UploadedFile | null;
  setFile: (file: UploadedFile | null) => void;
}
```
- **No persistence** — file data lives only in memory for the session

### 4.2 Local State

| Component | State Variables | Notes |
|-----------|----------------|-------|
| `UploadDropzone` | `isDragging`, `error` | UI-only, ephemeral |
| `ChatSection` | `messages`, `inputValue`, `hasStartedChat` | **Not persisted** — chat history lost on component unmount |
| `PdfViewer` | `pages`, `currentPageIndex`, `displayPageIndex`, `isTransitioning`, `searchQuery`, `activeSearch`, `searchId`, `searchStatus` | Pages loaded from IndexedDB |

---

## 5. Custom Hooks

### 5.1 `useHandshake`
```
Flow:
1. Check useSessionStore.sessionId
2. If null → generate UUID via crypto.randomUUID()
3. POST /api/users/handshake → { session_id: newUUID }
4. On success → store session_id in Zustand + sessionStorage
5. On error → console.error (no user-facing error handling)
```
- **Called by**: `SessionProvider` (once on app mount)
- **Returns**: `{ sessionId }`

### 5.2 `usePdfToText`

```
Flow:
1. Validate file is PDF (file.type === "application/pdf")
2. Init IndexedDB ("CitationBotDB" / "PdfPagesStore")
3. Read file as ArrayBuffer → pdfjs-dist parses it
4. For each page (max 10):
   a. Extract text items → join into single string
   b. Save to IndexedDB: key = "{filename}_page_{i}"
   c. Update progress: Math.round((i / numPages) * 100)
5. After all pages extracted:
   a. Generate fileId via crypto.randomUUID()
   b. POST /api/files/?session_id=X&file_id=Y → { data: string[] }
   c. Store fileId in useSessionStore
6. Cancel-safe via isCancelled flag in cleanup
```

**Helper Functions (module-level):**
- `initDB()` — Opens/creates IndexedDB
- `savePageToDB()` — Puts a page record into the object store
- `getPdfPagesFromDB(filename)` — Retrieves all pages for a file, sorted by pageIndex
- `uploadFileData(sessionId, fileId, data)` — POSTs text array to backend

---

## 6. Data Flow Diagrams

### 6.1 Session Initialization

```
App Mount
   │
   ▼
SessionProvider
   │
   ▼
useHandshake()
   │
   ├── sessionId exists in sessionStorage? 
   │     YES → skip, return existing sessionId
   │     NO  ▼
   │
   ▼
crypto.randomUUID()
   │
   ▼
POST /api/users/handshake { session_id }
   │
   ▼
Store session_id → Zustand + sessionStorage
```

### 6.2 File Upload & Processing

```
User drops/selects file
   │
   ▼
UploadDropzone.validateAndSetFile()
   │
   ├── Invalid extension? → Show error, stop
   │
   ▼
useUploadStore.setFile({ name, type, size, nativeFile })
   │
   ├── Triggers re-render → MainContent switches to SplitScreenView
   │
   ▼
SplitScreenView renders
   │
   ├── Left Panel: ChatSection
   │
   ├── Right Panel (PDF):
   │     ▼
   │   PdfViewer mounted (dynamic import)
   │     │
   │     ▼
   │   usePdfToText(nativeFile)
   │     │
   │     ├── pdfjs-dist extracts text page-by-page
   │     ├── Each page → IndexedDB
   │     ├── Progress bar updates
   │     ├── All pages → POST /api/files/ (backend)
   │     └── fileId → useSessionStore
   │
   │   getPdfPagesFromDB(filename)
   │     │
   │     ▼
   │   Render pages, thumbnails, search
   │
   └── Right Panel (non-PDF):
         Show file info + "Upload Another" button
```

### 6.3 Chat Flow (Current — Mocked)

```
User types message + submits
   │
   ▼
ChatSection.handleSendMessage()
   │
   ├── Add user message to local state
   ├── hasStartedChat = true → input moves to bottom
   │
   ▼
setTimeout(1200ms)
   │
   ▼
Add hardcoded bot response to local state
   │
   ▼
Auto-scroll to bottom
```

> **⚠️ Note:** The backend has real AI chat endpoints (`POST /api/chats/`, `GET /api/chats/`) but the frontend is NOT connected to them yet. Only mock responses are used.

---

## 7. Client-Side Storage

| Storage | Database/Key | Purpose | Persistence |
|---------|-------------|---------|-------------|
| **sessionStorage** | `session_id` | User session identifier | Tab lifetime |
| **IndexedDB** | `CitationBotDB` → `PdfPagesStore` | Cached PDF page text | Persistent across sessions |
| **Zustand (memory)** | `useSessionStore` | sessionId, fileId, isLoading | Tab lifetime |
| **Zustand (memory)** | `useUploadStore` | Uploaded file object | Tab lifetime |

---

## 8. Backend API Integration

| API Endpoint | Method | Frontend Usage | Status |
|-------------|--------|---------------|--------|
| `/api/users/handshake` | `POST` | `useHandshake.ts` — on app mount | ✅ Connected |
| `/api/users/handshake` | `GET` | Not used in frontend | ❌ Not Used |
| `/api/files/` | `POST` | `usePdfToText.ts` — after PDF extraction | ✅ Connected |
| `/api/files/` | `GET` | Not used in frontend | ❌ Not Used |
| `/api/chats/` | `POST` | Not connected — chat is mocked | ❌ Not Connected |
| `/api/chats/` | `GET` | Not connected — no chat history retrieval | ❌ Not Connected |

**Backend URL:** `https://citation-bot-backend-983894129463.europe-west1.run.app`

---

## 9. Styling Architecture

### 9.1 Design Tokens (CSS Custom Properties)
```css
--base-bg: #2b2b2b;          /* Dark grey background */
--base-fg: #f5f5f5;          /* Light text */
--neon-green: #39ff14;        /* Accent: active states, highlights */
--neon-blue: #04d9ff;         /* Accent: borders, interactive elements */
--border-radius: 32px;        /* Rounded everything */
--font-montserrat: 'Montserrat', sans-serif;
```

### 9.2 Animation System
| Animation | Used In | Description |
|-----------|---------|-------------|
| `float` | Title text | 6s vertical oscillation |
| `slideInLeft` | Left panel (chat) | Slide + fade from left on mount |
| `slideUp` | Chat bubbles | 0.4s slide up + fade in |
| `drawMarker` | Search highlight | 0.5s green highlight draw effect |

### 9.3 Layout Strategy
- **Single file** (`globals.css`, ~517 lines) containing ALL styles
- **No CSS Modules or Styled Components** — plain class names
- **Responsive transitions** — `.container` ↔ `.container-split` animated with `cubic-bezier(0.25, 1, 0.5, 1)`
- **TailwindCSS** configured but used minimally (mostly custom CSS)

---

## 10. Key Design Decisions & Limitations

### Current Design Decisions
1. **Flat component structure** — all components in a single `/components` directory, no nesting
2. **No service layer** — API calls embedded directly in hooks
3. **IndexedDB for PDF cache** — avoids re-parsing PDFs, but no eviction policy
4. **Dynamic import for PdfViewer** — prevents SSR issues with pdfjs-dist
5. **pdfjs-dist worker loaded from CDN** (`unpkg.com`) — no local worker bundling
6. **Max 10 pages** — hardcoded limit in `usePdfToText`
7. **Session-based auth** — no real authentication, just UUID-based sessions

### Known Limitations
1. **Chat is fully mocked** — backend chat API exists but isn't integrated
2. **No error boundaries** — API failures silently logged to console
3. **No loading states for chat** — no typing indicator or loading animation
4. **Non-PDF files show static info only** — no text extraction for .txt/.doc
5. **Single-file CSS** — all 517 lines in one file, no modular organization
6. **No tests** — no unit tests, integration tests, or E2E tests
7. **Chat history lost on re-upload** — stored only in component local state
8. **No file size validation** — any size file accepted
9. **Search finds only first occurrence** — no "next/previous match" navigation
10. **No responsive/mobile design** — split layout not adapted for small screens

---

## 11. Type Definitions

```typescript
// Message (ChatSection — local)
interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

// PageData (PdfViewer — local)
interface PageData {
  id: string;          // "{filename}_page_{pageIndex}"
  filename: string;
  pageIndex: number;
  text: string;
}

// UploadedFile (useUploadStore — global)
interface UploadedFile {
  name: string;
  type: string;        // Formatted label, not MIME type
  size: number;
  nativeFile: File;
}

// SessionStore (useSessionStore — global)
interface SessionStore {
  sessionId: string | null;
  fileId: string | null;
  isLoading: boolean;
  setSessionId: (id: string) => void;
  setFileId: (id: string) => void;
  setLoading: (loading: boolean) => void;
}
```
