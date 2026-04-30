import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

// Import CSS
import 'pdfjs-dist/legacy/web/pdf_viewer.css';
import './pdf-canvas.css';

import { Sidebar } from '@/layout/sidebar';

interface PdfCanvasProps {
  fileUrl?: string | null;
  numPages?: number;
  setNumPages?: (n: number) => void;
  pdfError?: string | null;
  setPdfError?: (err: string | null) => void;
  zoomLevel: number;
  pdfTheme: string;
  onPageActive: (pageNumber: number) => void;
  sidebarOpen?: boolean;
  currentPage?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  setZoomLevel?: (val: number | ((prev: number) => number)) => void;
  linkServiceRef?: any;
  findControllerRef?: any;
  eventBusRef?: any;
  initialPage?: number;
  onPagesInit?: () => void;
  rotation: number;
}

export function PdfCanvas({ 
  fileUrl,
  numPages,
  setNumPages,
  setPdfError,
  zoomLevel, 
  setZoomLevel,
  pdfTheme, 
  onPageActive,
  sidebarOpen,
  currentPage,
  scrollContainerRef,
  linkServiceRef,
  findControllerRef,
  eventBusRef,
  initialPage,
  onPagesInit,
  rotation
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  
  // Persist Mozilla APIs across renders so Sidebar can bind exactly like Firefox
  // Using passed eventBusRef from parent if present, fallback to local ref otherwise
  const localEventBusRef = useRef<any>(null);
  const activeEventBusRef = eventBusRef || localEventBusRef;
  
  const pdfViewerRef = useRef<any>(null);

  if (!activeEventBusRef.current) {
    activeEventBusRef.current = new pdfjsViewer.EventBus();
    if (linkServiceRef) {
      linkServiceRef.current = new pdfjsViewer.PDFLinkService({
        eventBus: activeEventBusRef.current,
      });
    }
    
    if (findControllerRef && linkServiceRef) {
      findControllerRef.current = new pdfjsViewer.PDFFindController({
        eventBus: activeEventBusRef.current,
        linkService: linkServiceRef.current,
      });
    }
  }
  
  useEffect(() => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.pagesRotation = rotation;
    }
  }, [rotation]);

  useEffect(() => {
    if (!containerRef.current || !viewerContainerRef.current) return;
    if (!fileUrl) return;

    let active = true;

    // Initialize the true, professional Mozilla PDFViewer
    const viewer = new pdfjsViewer.PDFViewer({
      container: containerRef.current,
      viewer: viewerContainerRef.current,
      eventBus: activeEventBusRef.current,
      linkService: linkServiceRef?.current,
      findController: findControllerRef?.current,
      textLayerMode: 2, // Enable Mozilla's enhanced text selection CSS
      annotationMode: 2, // Enable form fields and annotations
    });

    if (linkServiceRef) {
      linkServiceRef.current.setViewer(viewer);
    }
    pdfViewerRef.current = viewer;

    const handlePagesInit = () => {
      // Set initial zoom once pages initialized
      viewer.currentScaleValue = zoomLevel.toString();
      
      if (initialPage && initialPage > 1) {
        viewer.currentPageNumber = initialPage;
      }
      
      if (onPagesInit) onPagesInit();
    };
    activeEventBusRef.current.on('pagesinit', handlePagesInit);

    const handlePageChanging = (evt: any) => {
      onPageActive(evt.pageNumber);
    };
    activeEventBusRef.current.on('pagechanging', handlePageChanging);

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        const doc = await loadingTask.promise;
        if (!active) return;
        
        viewer.setDocument(doc);
        linkServiceRef.current.setDocument(doc, null);
        setPdfDoc(doc);
        if (setNumPages) setNumPages(doc.numPages);
        if (setPdfError) setPdfError(null);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (setPdfError) setPdfError(err.message || 'Failed to load PDF');
      }
    };

    loadDoc();

    return () => {
      active = false;
      activeEventBusRef.current.off('pagesinit', handlePagesInit);
      activeEventBusRef.current.off('pagechanging', handlePageChanging);
      // Clean up the viewer memory
      // @ts-ignore
      viewer.setDocument(null);
      setPdfDoc(null);
    };
  }, [fileUrl]);

  // Update Zoom Level Dynamically via Mozilla API
  useEffect(() => {
    if (pdfViewerRef.current && pdfViewerRef.current.currentScale !== zoomLevel) {
      pdfViewerRef.current.currentScaleValue = zoomLevel.toString();
    }
  }, [zoomLevel]);

  // Handle Ctrl+Wheel for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !setZoomLevel) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        setZoomLevel((prev) => {
          // Trackpads produce deltaY < 50 in rapid succession, mice produce solid 100/120 jumps
          const isTouchpad = Math.abs(e.deltaY) < 50;
          let newZoom = prev;
          
          if (isTouchpad) {
            // Very slow, smooth modifier for touchpad scrolling
            newZoom = prev + (e.deltaY * -0.01);
          } else {
            // Rigid 10% steps for physical mouse scroll wheels
            newZoom = e.deltaY < 0 ? prev + 0.1 : prev - 0.1;
          }

          // Lock between 50% and 500%
          return Math.min(Math.max(newZoom, 0.5), 5);
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoomLevel]);

  // Handle Arrow keys for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        if (pdfViewerRef.current) {
          const current = pdfViewerRef.current.currentPageNumber;
          const total = pdfViewerRef.current.pagesCount;
          if (current < total) {
            pdfViewerRef.current.currentPageNumber = current + 1;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (pdfViewerRef.current) {
          const current = pdfViewerRef.current.currentPageNumber;
          if (current > 1) {
            pdfViewerRef.current.currentPageNumber = current - 1;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Dark Mode CSS filtering smoothly over the PDFViewer class
  const getFilter = () => {
    if (pdfTheme === 'invert') return 'invert(0.92) hue-rotate(180deg) brightness(1.05) contrast(0.95)';
    if (pdfTheme === 'sepia') return 'sepia(100%) brightness(90%) hue-rotate(10deg)';
    return 'none';
  };

  return (
    <div className="flex flex-row flex-1 overflow-hidden relative w-full h-full">
      {sidebarOpen && pdfDoc && (
        <Sidebar 
          numPages={numPages || 0} 
          currentPage={currentPage || 1}
          onJumpToPage={(p) => {
            // Native Mozilla navigation event
            linkServiceRef.current.page = p;
          }}
          pdfDoc={pdfDoc}
          linkService={linkServiceRef.current}
        />
      )}

      <div 
        className="flex-1 w-full h-full bg-muted/10 relative"
        style={{ overflow: 'hidden' }}
      >
        <div 
          ref={(el) => {
            (containerRef as any).current = el;
            if (scrollContainerRef) {
              (scrollContainerRef as any).current = el;
            }
          }}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            overflow: 'auto',
            filter: getFilter(),
            transition: 'filter 0.2s ease-out'
          }}
        >
          
          <div 
            className="pdfViewer" 
            ref={viewerContainerRef}
          />
        </div>
      </div>
    </div>
  );
}
