import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Settings, Minus, Square, X, Plus, PanelTop, ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router';
import { DocumentObj } from '@/types/general';

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  secondaryBarOpen: boolean;
  setSecondaryBarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openDocuments: DocumentObj[];
  setOpenDocuments: React.Dispatch<React.SetStateAction<DocumentObj[]>>;
  activeDocumentId: string | null;
  setActiveDocumentId: (id: string) => void;
  onCloseDocument: (id: string) => void;
}

export function TopBar({ 
  isDarkMode, 
  setIsDarkMode, 
  secondaryBarOpen, 
  setSecondaryBarOpen, 
  openDocuments,
  setOpenDocuments,
  activeDocumentId,
  setActiveDocumentId,
  onCloseDocument
}: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isReader = location.pathname.includes('/reader');

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T for Home page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigate('/');
      }
      // Ctrl+B is usually sidebar. Let's use Ctrl+E for secondary bar toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setSecondaryBarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setSecondaryBarOpen]);

  // These functions communicate with main/index.ts for window controls
  // Ensure we check if `window.electron` exists for safety
  const handleMinimize = () => window.electron?.ipcRenderer.send('window-minimize');
  const handleMaximize = () => window.electron?.ipcRenderer.send('window-maximize');
  const handleClose = () => window.electron?.ipcRenderer.send('window-close');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Small margin of error (1px) for floating point rendering differences
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    // Re-check when window is resized
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [openDocuments, activeDocumentId]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
      // Update state slightly after smooth scroll completes
      setTimeout(checkScroll, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts to not interfere with clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setOpenDocuments((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        // Simple array move
        const newItems = [...items];
        const [moved] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, moved);
        return newItems;
      });
    }
  };

  return (
    <header 
      className="h-9 bg-muted/80 flex items-center justify-between border-b border-border z-10 shrink-0 select-none pl-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left Area: Controls & Logo */}
      <div className="flex items-center space-x-3 h-full shrink-0">
        <Link to="/" className="font-semibold text-[13px] flex items-center gap-1.5 text-indigo-500 hover:opacity-80 transition-opacity mt-1.5 mr-2" title="Go to Home" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span className="w-4 h-4 rounded bg-indigo-500 text-white flex items-center justify-center font-bold text-[8px]">V</span>
          Velora
        </Link>
      </div>

      {/* Center: Browser-like Tabs */}
      <div className="flex h-full shrink grow items-end gap-1 px-2 pt-1.5 overflow-hidden" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button 
            onClick={scrollLeft}
            className="mb-1.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10 bg-background/50 shadow-sm border border-border"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Scroll tabs left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Tab Container */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
        >
          <div 
            ref={scrollContainerRef}
            onWheel={handleWheel}
            onScroll={checkScroll}
            className="flex items-end gap-1.5 h-full w-full overflow-x-auto pb-0 mb-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            <SortableContext items={openDocuments.map(d => d.id)} strategy={horizontalListSortingStrategy}>
              {/* Active Tabs */}
              {openDocuments.map((doc) => (
                <SortableTab 
                  key={doc.id}
                  doc={doc}
                  isActive={location.pathname !== '/' && doc.id === activeDocumentId}
                  onClick={() => {
                    setActiveDocumentId(doc.id);
                    navigate('/reader');
                  }}
                  onClose={() => onCloseDocument(doc.id)}
                />
              ))}
            </SortableContext>

            {/* New Tab Button */}
            <button 
              onClick={() => navigate('/')}
              className="h-6 w-6 flex items-center justify-center rounded-md bg-transparent hover:bg-muted/80 text-muted-foreground transition-colors shrink-0 mb-1" 
              title="Back to Home / Open new document"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </DndContext>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button 
            onClick={scrollRight}
            className="mb-1.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10 bg-background/50 shadow-sm border border-border"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Scroll tabs right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Guaranteed Drag Space (Draggable margin) */}
      <div className="w-12 h-full shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>

      {/* Right Area: Tools & Window Controls */}
      <div className="flex items-center h-full space-x-1 shrink-0">
        <div className="flex items-center space-x-0.5 mr-2 mt-0.5">
          {isReader && (
            <div className="flex items-center mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-5 w-5 text-muted-foreground ${secondaryBarOpen ? 'bg-muted/80 text-foreground' : ''}`}
                onClick={() => setSecondaryBarOpen(!secondaryBarOpen)}
                title="Toggle Secondary Toolbar (Ctrl+E)"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                <PanelTop className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-muted-foreground"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Theme"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" title="Settings" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <Settings className="w-3 h-3" />
          </Button>
        </div>

        {/* Window Controls - Right aligned */}
        <div className="flex h-full items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={handleMinimize} className="h-full px-3 hover:bg-muted/80 text-muted-foreground transition-colors flex items-center">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={handleMaximize} className="h-full px-3 hover:bg-muted/80 text-muted-foreground transition-colors flex items-center">
            <Square className="w-2.5 h-2.5" />
          </button>
          <button onClick={handleClose} className="h-full px-3 hover:bg-red-500 hover:text-white text-muted-foreground transition-colors flex items-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

interface SortableTabProps {
  doc: DocumentObj;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

function SortableTab({ doc, isActive, onClick, onClose }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : isActive ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    WebkitAppRegion: 'no-drag' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative max-w-45 w-48 min-w-30 rounded-t-md px-3 py-1.5 flex items-center pr-7 cursor-pointer transition-[background-color,color,border-color,opacity,box-shadow] shadow-sm border border-b-0 shrink-0
        ${isActive 
          ? 'bg-background text-foreground border-border font-medium' 
          : 'bg-black/5 dark:bg-white/5 text-muted-foreground border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground'}`}
    >
      <span className="text-[11px] truncate w-full select-none">{doc.name}</span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`absolute right-1.5 p-0.5 rounded transition-all hover:bg-muted-foreground/20 hover:text-foreground
          ${isActive ? 'opacity-100 text-muted-foreground' : 'opacity-0 group-hover:opacity-100 text-muted-foreground/60'}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
