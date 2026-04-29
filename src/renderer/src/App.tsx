import { Route, Routes, useNavigate } from 'react-router'
import Home from './pages/Home'
import { TopBar } from './layout/top-bar'
import { useEffect, useState } from 'react';
import { DocumentObj } from './types/general';
import { ReaderPage } from './pages/Reader';

function App(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [secondaryBarOpen, setSecondaryBarOpen] = useState(true);

  const [openDocuments, setOpenDocuments] = useState<DocumentObj[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const activeDocument = openDocuments.find(d => d.id === activeDocumentId) || null;

  const navigate = useNavigate();

  useEffect(() => {
    console.log('Active document changed:', openDocuments);
  }, [openDocuments])
  
  const handleOpenDocument = (path: string, name: string) => {
    // Check if exactly this path is already open
    const existing = openDocuments.find(d => d.path === path);
    if (existing) {
      setActiveDocumentId(existing.id);
      return;
    }
    
    const newDoc: DocumentObj = { id: Date.now().toString(), path, name };
    setOpenDocuments(prev => [...prev, newDoc]);
    setActiveDocumentId(newDoc.id);
  };

  const handleCloseDocument = (id: string) => {
    setOpenDocuments(prev => {
      const filtered = prev.filter(d => d.id !== id);
      
      // If we are closing the currently active tab
      if (activeDocumentId === id) {
        const newActiveId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
        setActiveDocumentId(newActiveId);
        if (!newActiveId) {
          navigate('/');
        }
      }
      return filtered;
    });
  };


  // Global viewer state for the active tab (in a fuller app, keep these objects linked to document IDs)
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [pdfTheme, setPdfTheme] = useState('normal');

  useEffect(() => {
    // Moved Touchpad zoom logic to reader.tsx to handle Cursor Centering math appropriately.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(prev + 0.1, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <div className="flex flex-col h-screen text-foreground bg-accent">
      <TopBar 
        secondaryBarOpen={secondaryBarOpen}
        setSecondaryBarOpen={setSecondaryBarOpen}
        openDocuments={openDocuments}
        setOpenDocuments={setOpenDocuments} // We need this for drag and drop reordering
        activeDocumentId={activeDocumentId}
        setActiveDocumentId={setActiveDocumentId}
        onCloseDocument={handleCloseDocument}/>
      <div className=' w-full h-full bg-accent overflow-y-auto'>
        <Routes>
          <Route path="/" element={<Home onOpenDocument={handleOpenDocument} />} />
          <Route path="/reader" element={
          <ReaderPage 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            secondaryBarOpen={secondaryBarOpen}
            setSecondaryBarOpen={setSecondaryBarOpen}
            activeDocument={activeDocument}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            pdfTheme={pdfTheme}
            setPdfTheme={setPdfTheme}
          />
        } />
        </Routes>

      </div>
    </div>
  )
}

export default App
