import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfCanvas } from '@/reader/pdf-canvas';
import { SecondaryBar } from '@/layout/secondary-bar';
import { DocumentObj } from '@/types/general';
import { saveDocumentState, getDb, removeDocument } from '../lib/db';

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { link } from 'fs';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface ReaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  secondaryBarOpen: boolean;
  setSecondaryBarOpen: (open: boolean) => void;
  activeDocument: DocumentObj | null;
  zoomLevel: number;
  setZoomLevel: (val: number) => void;
  pdfTheme: string;
  setPdfTheme: (val: string) => void;
}

export function ReaderPage({ 
  sidebarOpen, 
  setSidebarOpen, 
  secondaryBarOpen, 
  setSecondaryBarOpen, 
  activeDocument,
  zoomLevel,
  setZoomLevel,
  pdfTheme,
  setPdfTheme
}: ReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const linkServiceRef = useRef<any>(null);

  useEffect(() => {
    // Reset page states when opening a new document
    setCurrentPage(1);
    setNumPages(0);
    setPdfError(null);
    console.log('Active document changed in ReaderPage:', activeDocument);
    
    setFileUrl(prevUrl => {
       if (prevUrl) URL.revokeObjectURL(prevUrl);
       return null;
    });
    
    if (activeDocument) {
      let isActive = true;
      const loadPdf = async () => {
        try {
          const buffer = await (window.api as any).readFile(activeDocument.path);
          if (!buffer) throw new Error('Failed to read file buffer');
          if (isActive) {
             const blob = new Blob([buffer], { type: 'application/pdf' });
             setFileUrl(URL.createObjectURL(blob));
             console.log('PDF loaded successfully:', activeDocument.path);
             console.log(URL.createObjectURL(blob));
          }
        } catch (err: any) {
          console.error('Error loading PDF:', err);
          if (isActive) {
             setPdfError(err.message || 'Failed to load PDF');
             removeDocument(activeDocument.path).catch(console.error);
          }
        }
      };
      
      loadPdf();


      // // Check IndexedDB if we have a saved spot
      // getDb().then(async (db) => {
      //   const docSettings = await db.get('documents', activeDocument.path);
      //   console.log('Loaded document settings from DB:', docSettings);
      //   if (docSettings && docSettings.pageNumber > 1) {
      //     // Add small delay to let canvas renderers mount into DOM
      //     setTimeout(() => {
      //       if (linkServiceRef) {
      //         linkServiceRef.current.page = docSettings.pageNumber;
      //       } else {
      //         // Try again if still rendering
      //         const interval = setInterval(() => {
      //           if (linkServiceRef) {
      //             linkServiceRef.current.page = docSettings.pageNumber;
      //             clearInterval(interval);
      //           }
      //         }, 200);
      //         setTimeout(() => clearInterval(interval), 3000); // max wait
      //       }
      //     }, 1000);
      //   }
      // });
      
      return () => { isActive = false; };
    }
  }, [activeDocument?.id]);


  useEffect(() => {
  if (linkServiceRef.current && activeDocument) {
    getDb().then(async (db) => {
      const docSettings = await db.get('documents', activeDocument.path);
      if (docSettings&&docSettings?.pageNumber > 1) {
        linkServiceRef.current.page = docSettings.pageNumber;
      }
    });
  }
}, [linkServiceRef.current, activeDocument]); // Re-run when the ref is assigned



  const handlePageActive = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  useEffect(() => {
    if (activeDocument && numPages > 0) {
      saveDocumentState(activeDocument.path, activeDocument.name, currentPage, numPages).catch((err) => {
        console.error('Failed to save document state to DB', err);
      });
    }
  }, [activeDocument, currentPage, numPages]);

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">
      <SecondaryBar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        secondaryBarOpen={secondaryBarOpen} 
        setSecondaryBarOpen={setSecondaryBarOpen}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        pdfTheme={pdfTheme}
        setPdfTheme={setPdfTheme}
        currentPage={currentPage}
        numPages={numPages}
        onJumpToPage={(p) => {
          linkServiceRef.current.page = p;
        }}
      />
      
      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        {fileUrl ? (
          <PdfCanvas 
            fileUrl={fileUrl}
            numPages={numPages}
            setNumPages={setNumPages}
            zoomLevel={zoomLevel} 
            setZoomLevel={setZoomLevel}
            pdfTheme={pdfTheme}
            onPageActive={handlePageActive}
            sidebarOpen={sidebarOpen}
            currentPage={currentPage}
            pdfError={pdfError}
            setPdfError={setPdfError}
            scrollContainerRef={scrollContainerRef}
            linkServiceRef={linkServiceRef}
          />
        ) : (
          <div className="flex flex-1 w-full h-full justify-center items-center">
            {pdfError ? (
              <div className="text-red-500 font-medium bg-red-500/10 px-6 py-3 rounded-lg border border-red-500/20">
                Error: {pdfError}
              </div>
            ) : (
              <div className="text-muted-foreground mt-20">No PDF selected</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
