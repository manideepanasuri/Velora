import React, { useState } from 'react';
import { SidebarIcon, ZoomIn, ZoomOut, Search, Settings2, Highlighter, Edit3, BookmarkPlus, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Palette } from 'lucide-react';
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
}

export function SecondaryBar({ 
  sidebarOpen, 
  setSidebarOpen, 
  secondaryBarOpen, 
  setSecondaryBarOpen,
  zoomLevel,
  setZoomLevel,
  pdfTheme,
  setPdfTheme,
  currentPage = 1,
  numPages = 0,
  onJumpToPage
}: SecondaryBarProps) {
  const handleZoomOut = () => setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
  const handleZoomIn = () => setZoomLevel(Math.min(5.0, zoomLevel + 0.25));

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
        
        <div className="h-4 w-[1px] bg-border mx-1"></div>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Highlighter className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <BookmarkPlus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search document..." 
            className="pl-8 pr-3 py-1 rounded bg-muted/50 text-xs border-none focus:ring-1 focus:ring-indigo-500 outline-none w-48 transition-all focus:w-64"
          />
        </div>

        <div className="h-4 w-[1px] bg-border mx-1"></div>

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

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground mr-1" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium w-12 text-center text-foreground">{Math.round(zoomLevel * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground ml-1" onClick={handleZoomIn}>
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
