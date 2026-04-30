import React, { useState, useEffect, useRef } from 'react';
import { SidebarIcon, ZoomIn, ZoomOut, Search, ChevronUp, ChevronDown, Palette, X, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem 
} from '@/components/ui/dropdown-menu';

interface SecondaryBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  secondaryBarOpen: boolean;
  setSecondaryBarOpen: (open: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (val: number) => void;
  pdfTheme: string;
  setPdfTheme: (val: string) => void;
  currentPage?: number;
  numPages?: number;
  onJumpToPage?: (page: number) => void;
  findControllerRef?: React.RefObject<any>;
  eventBusRef?: React.RefObject<any>;
  rotation: number;
  setRotation: (val: number | ((prev: number) => number)) => void;
}

export function SecondaryBar({ 
  sidebarOpen, 
  setSidebarOpen, 
  secondaryBarOpen, 
  //@ts-ignore
  setSecondaryBarOpen,
  zoomLevel,
  setZoomLevel,
  pdfTheme,
  setPdfTheme,
  currentPage = 1,
  numPages = 0,
  onJumpToPage,
  //@ts-ignore
  findControllerRef,
  eventBusRef,
  //@ts-ignore
  rotation,
  setRotation
}: SecondaryBarProps) {
  const handleZoomOut = () => setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
  const handleZoomIn = () => setZoomLevel(Math.min(5.0, zoomLevel + 0.25));

  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatch, setSearchMatch] = useState({ current: 0, total: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const executeSearch = (query: string, previous = false) => {
    if (!eventBusRef?.current) return;
    
    if (!query) {
      setSearchMatch({ current: 0, total: 0 });
    }

    eventBusRef.current.dispatch('find', {
      //@ts-ignore
      source: this,
      type: '',
      query: query,
      phraseSearch: true,
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious: previous,
    });
  };

  const handleSearchNext = () => {
    if (!searchQuery) return;
    if (!eventBusRef?.current) return;

    eventBusRef.current.dispatch('find', {
      //@ts-ignore
      source: this,
      type: 'again',
      query: searchQuery,
      phraseSearch: true,
      caseSensitive: false,
      highlightAll: true,
      findPrevious: false,
    });
  };

  const handleSearchPrev = () => {
    if (!searchQuery) return;
    if (!eventBusRef?.current) return;

    eventBusRef.current.dispatch('find', {
      //@ts-ignore
      source: this,
      type: 'again',
      query: searchQuery,
      phraseSearch: true,
      caseSensitive: false,
      highlightAll: true,
      findPrevious: true,
    });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchMatch({ current: 0, total: 0 });
    if (!eventBusRef?.current) return;
    
    eventBusRef.current.dispatch('find', { 
      //@ts-ignore
      source: this,
      type: '', 
      query: '' 
    });
  };

  // Sync internal input value if currentPage changes via scroll
  useEffect(() => {
    const eventBus = eventBusRef?.current;
    if (!eventBus) return;

    const updateMatches = (e: any) => {
      if (e && e.matchesCount) {
        setSearchMatch({
          current: e.matchesCount.total > 0 ? e.matchesCount.current : 0,
          total: e.matchesCount.total
        });
      }
    };

    const updateControlState = (e: any) => {
      if (e && e.matchesCount) {
        setSearchMatch({
          current: e.matchesCount.total > 0 ? e.matchesCount.current : 0,
          total: e.matchesCount.total
        });
      } else if (e?.state === 1) {
        // state 1: NOT_FOUND
        setSearchMatch({ current: 0, total: 0 });
      }
    };

    eventBus.on('updatefindmatchescount', updateMatches);
    eventBus.on('updatefindcontrolstate', updateControlState);
    return () => {
      eventBus.off('updatefindmatchescount', updateMatches);
      eventBus.off('updatefindcontrolstate', updateControlState);
    };
  }, [eventBusRef?.current]);

  const handleNextPage = () => {
    if (currentPage < numPages && onJumpToPage) onJumpToPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && onJumpToPage) onJumpToPage(currentPage - 1);
  };

  const [inputVal, setInputVal] = useState<string>(String(currentPage));

  // Sync internal input value if currentPage changes via scroll
  React.useEffect(() => {
    setInputVal(String(currentPage));
  }, [currentPage]);

  const handleJump = () => {
    const p = parseInt(inputVal, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages && onJumpToPage) {
      onJumpToPage(p);
    } else {
      setInputVal(String(currentPage));
    }
  };

  if (!secondaryBarOpen) {
    return (
      <div className="absolute top-3 right-6 z-50 bg-background/60 backdrop-blur-md border border-border/50 rounded-full px-3 py-1 flex items-center shadow-sm select-none">
        <button 
          onClick={handlePrevPage}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/80 disabled:opacity-50"
          disabled={currentPage <= 1}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <div className="text-[11px] font-medium flex items-center mx-2">
          <span className="text-foreground">{currentPage}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground">{numPages}</span>
        </div>
        <button 
          onClick={handleNextPage}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/80 disabled:opacity-50"
          disabled={currentPage >= numPages}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-9 bg-background border-b border-border flex items-center justify-between px-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground mr-2" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar (Ctrl+B)">
          <SidebarIcon className="w-4 h-4" />
        </Button>
        
        {/* <div className="h-4 w-[1px] bg-border mx-1"></div>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Highlighter className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <BookmarkPlus className="w-4 h-4" />
        </Button> */}

        <div className="relative flex items-center">
          <Button 
            variant={searchOpen ? "secondary" : "ghost"} 
            size="icon" 
            className="h-7 w-7 text-muted-foreground" 
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
            }} 
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </Button>

          {searchOpen && (
            <div className="absolute top-9 left-0 z-50 flex items-center bg-background border border-border shadow-lg rounded-md px-2 py-1.5 space-x-2 w-64 animate-in fade-in slide-in-from-top-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search document..."
                className="flex-1 bg-transparent text-sm border-none outline-none focus:ring-0 px-1 placeholder:text-muted-foreground/60 w-full text-foreground"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  executeSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) handleSearchPrev();
                    else handleSearchNext();
                  }
                  if (e.key === 'Escape') {
                    closeSearch();
                  }
                }}
              />
              <div className="flex items-center text-xs text-muted-foreground min-w-fit px-1">
                {searchMatch.total > 0 ? `${searchMatch.current}/${searchMatch.total}` : '0/0'}
              </div>
              <div className="flex items-center space-x-0.5 border-l border-border pl-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleSearchPrev} disabled={!searchMatch.total} title="Previous Match (Shift+Enter)">
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleSearchNext} disabled={!searchMatch.total} title="Next Match (Enter)">
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={closeSearch} title="Close">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">

        {/* Page Controls */}
        <div className="flex items-center space-x-1 mx-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground disabled:opacity-50" onClick={handlePrevPage} disabled={currentPage <= 1}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <div className="flex items-center text-xs font-medium">
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={handleJump}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              className="w-10 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 transition-all" 
            />
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-muted-foreground">{numPages}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground disabled:opacity-50" onClick={handleNextPage} disabled={currentPage >= numPages}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-4 w-[1px] bg-border mx-1"></div>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground mr-1" onClick={handleRotateLeft} title="Rotate Left">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground mr-1" onClick={handleRotateRight} title="Rotate Right">
          <RotateCw className="w-4 h-4" />
        </Button>

        <div className="h-4 w-[1px] bg-border mx-1"></div>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground mr-1" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium w-12 text-center text-foreground">{Math.round(zoomLevel * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground ml-1" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="h-4 w-[1px] bg-border mx-1"></div>

        {/* PDF Theme Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 px-2 text-xs text-muted-foreground flex items-center gap-1.5 focus-visible:ring-0 transition-colors hover:text-foreground">
              <Palette className="w-3.5 h-3.5" />
              <span className="w-10 text-left capitalize hidden sm:inline-block">{pdfTheme}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuRadioGroup value={pdfTheme} onValueChange={setPdfTheme}>
              <DropdownMenuRadioItem value="normal" className="text-xs">Normal</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="invert" className="text-xs">Invert</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="sepia" className="text-xs">Sepia</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
