import React, { useState, useEffect, useRef } from 'react';
import { Layers, List, Bookmark } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface SidebarProps {
  numPages: number;
  currentPage: number;
  onJumpToPage: (page: number) => void;
  pdfDoc?: pdfjsLib.PDFDocumentProxy;
  linkService?: any;
}

export function Sidebar({ numPages, currentPage, onJumpToPage, pdfDoc, linkService }: SidebarProps) {
  const [tab, setTab] = useState<'thumbs' | 'outline' | 'bookmarks'>('thumbs');
  const [outline, setOutline] = useState<any[] | null>(null);

  useEffect(() => {
    if (pdfDoc && tab === 'outline' && !outline) {
      pdfDoc.getOutline().then((ol) => {
        setOutline(ol || []);
      });
    }
  }, [pdfDoc, tab, outline]);

  // Scroll active thumbnail into view when current page changes via main viewer
  useEffect(() => {
    if (tab === 'thumbs') {
      const activeEl = document.getElementById(`thumb-wrapper-${currentPage}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPage, tab]);

  const handleOutlineClick = (item: any) => {
    if (linkService && item.dest) {
      linkService.goToDestination(item.dest);
    } else if (pdfDoc && item.dest) {
      pdfDoc.getPageIndex(item.dest[0]).then(idx => onJumpToPage(idx + 1));
    }
  };

  const renderOutlineItems = (items: any[], depth = 0) => {
    return items.map((item, i) => (
      <div key={`outline-${depth}-${i}`}>
        <div 
          className="cursor-pointer hover:bg-muted/50 py-1.5 px-2 rounded truncate transition-colors" 
          style={{ paddingLeft: `${(depth * 1) + 0.5}rem` }}
          onClick={() => handleOutlineClick(item)}
          title={item.title}
        >
          {item.title}
        </div>
        {item.items && item.items.length > 0 && (
          <div className="border-l border-border/40 ml-2">
            {renderOutlineItems(item.items, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col shrink-0 h-full overflow-hidden">
      <div className="flex border-b border-border shrink-0">
        <button 
          onClick={() => setTab('thumbs')}
          className={`flex-1 p-2 flex justify-center hover:bg-muted/50 ${tab === 'thumbs' ? 'text-foreground border-b-2 border-indigo-500' : 'text-muted-foreground'}`}
        >
          <Layers className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setTab('outline')}
          className={`flex-1 p-2 flex justify-center hover:bg-muted/50 ${tab === 'outline' ? 'text-foreground border-b-2 border-indigo-500' : 'text-muted-foreground'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setTab('bookmarks')}
          className={`flex-1 p-2 flex justify-center hover:bg-muted/50 ${tab === 'bookmarks' ? 'text-foreground border-b-2 border-indigo-500' : 'text-muted-foreground'}`}
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {tab === 'thumbs' && (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {Array.from({ length: numPages }, (_, index) => {
              const pageNum = index + 1;
              const isActive = currentPage === pageNum;
              return (
                <div 
                  key={`thumb-${pageNum}`}
                  id={`thumb-wrapper-${pageNum}`}
                  onClick={() => onJumpToPage(pageNum)}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    isActive 
                      ? 'opacity-100' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-full aspect-[1/1.4] rounded mb-1 overflow-hidden shadow-sm flex items-center justify-center bg-white dark:bg-zinc-900 ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-background' : 'border border-border'}`}>
                    <ThumbCanvas pdfDoc={pdfDoc} pageNumber={pageNum} isActive={isActive} />
                  </div>
                  <div className={`text-[10px] w-full text-center ${isActive ? 'text-indigo-500 font-medium' : 'text-muted-foreground'}`}>
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {tab === 'outline' && (
          <div className="text-sm font-medium text-foreground/80">
            {outline && outline.length > 0 ? (
              <div className="space-y-1">
                {renderOutlineItems(outline)}
              </div>
            ) : (
              <div className="text-muted-foreground italic text-center py-10">No outline found.</div>
            )}
          </div>
        )}

        {tab === 'bookmarks' && (
          <div className="text-sm text-muted-foreground text-center py-10 mt-10 border-t border-border/10">
            Bookmarks coming soon!
          </div>
        )}
      </div>
    </aside>
  );
}

function ThumbCanvas({ pdfDoc, pageNumber, isActive }: { pdfDoc?: pdfjsLib.PDFDocumentProxy, pageNumber: number, isActive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { rootMargin: '200px' });
    
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    if (!isVisible || !pdfDoc || !canvasRef.current) return;

    pdfDoc.getPage(pageNumber).then(page => {
      if (!active) return;
      const viewport = page.getViewport({ scale: 0.2 }); // highly scaled down for thumbnail
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      page.render({ canvasContext: ctx, viewport });
    });

    return () => { active = false; };
  }, [isVisible, pdfDoc, pageNumber]);

  return <canvas ref={canvasRef} className="w-full h-full object-contain" />;
}
