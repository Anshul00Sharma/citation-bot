import { useState, useRef, useEffect } from 'react';
import { usePdfToText, getPdfPagesFromDB } from '@/hooks/usePdfToText';

interface PageData {
  id: string;
  filename: string;
  pageIndex: number;
  text: string;
}

export default function PdfViewer({ nativeFile }: { nativeFile: File }) {
  const { isProcessing, progress, error } = usePdfToText(nativeFile);
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

  useEffect(() => {
    if (!isProcessing && !error) {
      getPdfPagesFromDB(nativeFile.name).then((data) => {
        setPages(data);
        if (data.length > 0) {
          setCurrentPageIndex(data[0].pageIndex);
          setDisplayPageIndex(data[0].pageIndex);
        }
      });
    }
  }, [isProcessing, error, nativeFile.name]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setActiveSearch("");
      setSearchStatus("idle");
      return;
    }
    
    const query = searchQuery.trim().toLowerCase();
    const matchedPage = pages.find(p => p.text.toLowerCase().includes(query));
    
    if (matchedPage) {
      setActiveSearch(searchQuery.trim());
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

  if (isProcessing || pages.length === 0) {
    return (
      <div className="pdf-viewer-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2 style={{ color: 'var(--neon-green)', marginBottom: '1.5rem', fontSize: '2rem' }}>Extracting Text...</h2>
        <div style={{ width: '80%', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--neon-blue)', transition: 'width 0.4s ease-out' }}></div>
        </div>
        <p style={{ marginTop: '1rem', color: '#aaa', fontWeight: 600 }}>{progress}%</p>
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

      <div className="pdf-gap" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchStatus === 'not_found') setSearchStatus('idle'); // reset on typing
            }}
            placeholder="Search document exactly..."
            style={{
              flex: 1,
              padding: '0.8rem 1.2rem',
              borderRadius: '999px',
              border: searchStatus === 'not_found' ? '2px solid #ff4757' : '2px solid #444',
              backgroundColor: '#252525',
              color: 'var(--base-fg)',
              outline: 'none',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '999px',
              backgroundColor: 'var(--neon-blue)',
              color: '#000',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Find Text
          </button>
        </form>
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
