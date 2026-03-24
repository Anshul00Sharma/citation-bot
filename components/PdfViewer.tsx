import { useState, useRef, useEffect, useCallback } from 'react';
import { usePdfToText } from '@/hooks/usePdfToText';
import { useSearchStore } from '@/store/useSearchStore';

interface PageData {
  id: string;
  filename: string;
  pageIndex: number;
  text: string;
}

export default function PdfViewer({ nativeFile, fetchedData }: { nativeFile?: File, fetchedData?: string[] }) {
  const { isProcessing, progress, error, extractedPages } = usePdfToText(nativeFile || null);
  const { activeSearchQuery, triggerSearchId } = useSearchStore();
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);
  const [displayPageIndex, setDisplayPageIndex] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const mainViewRef = useRef<HTMLDivElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchId, setSearchId] = useState(0);
  const [searchStatus, setSearchStatus] = useState<"idle" | "found" | "not_found">("idle");
  const highlightRef = useRef<HTMLSpanElement>(null);

  // Expose the internal search logic as a reusable function
  const executeSearch = useCallback((queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setActiveSearch("");
      setSearchStatus("idle");
      return;
    }

    // Set the local input value to match the global trigger
    setSearchQuery(queryToSearch.trim());

    const query = queryToSearch.trim().toLowerCase();
    const matchedPage = pages.find(p => p.text.toLowerCase().includes(query));

    if (matchedPage) {
      setActiveSearch(queryToSearch.trim());
      setSearchStatus("found");
      setSearchId(Date.now());

      if (matchedPage.pageIndex !== currentPageIndex) {
        setIsTransitioning(true);
        setCurrentPageIndex(matchedPage.pageIndex);
        setTimeout(() => {
          setDisplayPageIndex(matchedPage.pageIndex);
          setIsTransitioning(false);
        }, 300);
      }
    } else {
      setSearchStatus("not_found");
    }
  }, [pages, currentPageIndex]);

  // Track last processed global search to prevent unwanted re-triggers during page navigation
  const lastProcessedSearchId = useRef(0);

  // Listen for global search triggers from the chat
  useEffect(() => {
    if (triggerSearchId > lastProcessedSearchId.current && activeSearchQuery) {
      lastProcessedSearchId.current = triggerSearchId;
      executeSearch(activeSearchQuery);
    }
  }, [triggerSearchId, activeSearchQuery, executeSearch]);

  useEffect(() => {
    let sourceData = fetchedData;

    // Use newly extracted pages if we have a native file upload
    if (nativeFile && !isProcessing && !error && extractedPages && extractedPages.length > 0) {
      sourceData = extractedPages;
    }

    if (sourceData && sourceData.length > 0) {
      const mappedPages: PageData[] = sourceData.map((text, i) => ({
        id: `page_${i + 1}`,
        filename: "Uploaded Document",
        pageIndex: i + 1,
        text
      }));
      setPages(mappedPages);
      if (mappedPages.length > 0) {
        setCurrentPageIndex(mappedPages[0].pageIndex);
        setDisplayPageIndex(mappedPages[0].pageIndex);
      }
    } else {
      setPages([]);
    }
  }, [fetchedData, nativeFile, isProcessing, error, extractedPages]);

  const handlePageClick = (newPageIndex: number) => {
    if (newPageIndex === currentPageIndex) return;
    setIsTransitioning(true);
    setCurrentPageIndex(newPageIndex);
    setTimeout(() => {
      setDisplayPageIndex(newPageIndex);
      setIsTransitioning(false);

      // We clear highlights when manually navigating pages
      setActiveSearch("");
      setSearchStatus("idle");

      if (mainViewRef.current) {
        mainViewRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 300);
  };



  // Scroll to highlight
  useEffect(() => {
    if (searchStatus === "found" && highlightRef.current && !isTransitioning) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Allow render cycle to complete
    }
  }, [searchStatus, displayPageIndex, isTransitioning]);

  function renderHighlightedText(text: string, query: string) {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <span
          key={`highlight-${searchId}`}
          ref={highlightRef}
          className="marker-highlight"
        >
          {match}
        </span>
        {after}
      </>
    );
  }

  if ((!fetchedData && isProcessing) || pages.length === 0) {
    return (
      <div className="pdf-viewer-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2 style={{ color: 'var(--neon-green)', marginBottom: '1.5rem', fontSize: '2rem' }}>
          {!fetchedData && isProcessing ? "Extracting Text..." : "Loading Document..."}
        </h2>
        {!fetchedData && isProcessing && (
          <>
            <div style={{ width: '80%', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--neon-blue)', transition: 'width 0.4s ease-out' }}></div>
            </div>
            <p style={{ marginTop: '1rem', color: '#aaa', fontWeight: 600 }}>{progress}%</p>
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-container" style={{ justifyContent: 'center', alignItems: 'center', color: '#ff4757', height: '100%' }}>
        <h2>Error analyzing PDF</h2>
        <p style={{ marginTop: '1rem' }}>{error}</p>
      </div>
    );
  }

  const currentPageData = pages.find(p => p.pageIndex === displayPageIndex);

  return (
    <div className="pdf-viewer-container">
      <div
        className="pdf-main-view"
        ref={mainViewRef}
        style={{
          padding: '3rem',
          overflowY: 'auto',
          display: 'block',
          backgroundColor: '#2b2b2b',
          border: '2px solid #444',
          position: 'relative'
        }}
      >
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(15px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          <h3 style={{
            borderBottom: '2px solid var(--neon-blue)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--neon-blue)',
            fontSize: '1.5rem'
          }}>
            Page {displayPageIndex}
          </h3>
          <div style={{
            fontSize: '1rem',
            lineHeight: '1.4',
            color: 'var(--base-fg)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {currentPageData?.text ? renderHighlightedText(currentPageData.text, activeSearch) : "No text found on this page."}
          </div>
        </div>
      </div>

      <div className="pdf-gap" style={{ flex: 1, minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      </div>

      <div className="pdf-thumbnails">
        {pages.map((page) => {
          const snippet = page.text ? page.text.trim().split(/\s+/).slice(0, 6).join(' ') + '...' : '[Blank Page]';
          return (
            <div
              key={page.id}
              onClick={() => handlePageClick(page.pageIndex)}
              className={`pdf-thumbnail ${currentPageIndex === page.pageIndex ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                minWidth: '90px',
                maxWidth: '90px',
                height: '100%',
                border: '2px solid',
                borderColor: currentPageIndex === page.pageIndex ? 'var(--neon-blue)' : '#444',
                borderRadius: '8px',
                backgroundColor: currentPageIndex === page.pageIndex ? '#303030' : '#222',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <h4 style={{
                color: currentPageIndex === page.pageIndex ? 'var(--neon-green)' : '#aaa',
                marginBottom: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 800
              }}>
                {page.pageIndex}
              </h4>
              <p style={{
                fontSize: '0.55rem',
                color: '#888',
                textAlign: 'center',
                lineHeight: '1.2',
                wordBreak: 'break-word',
                overflow: 'hidden'
              }}>
                {snippet}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
