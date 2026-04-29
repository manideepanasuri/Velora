import React, { useEffect, useState } from 'react';
import { FilePlus, FileText, Clock, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getRecentDocuments, removeDocument } from '@/lib/db';

interface RecentDoc {
  id: string; // filePath
  path: string;
  name: string;
  pageNumber: number;
  totalPages: number;
  lastOpened: number;
}

export default function Home({ onOpenDocument }: { onOpenDocument: (path: string, name: string) => void }) {
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);

  useEffect(() => {
    loadRecentDocs();
  }, []);

  const loadRecentDocs = async () => {
    try {
      const docs = await getRecentDocuments();
      setRecentDocs(docs);
    } catch (e) {
      console.error('Failed to load recent documents', e);
    }
  };

  const handleRemoveDoc = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await removeDocument(path);
      setRecentDocs(prev => prev.filter(d => d.path !== path));
    } catch (err) {
      console.error('Failed to remove document', err);
    }
  };

  const handleOpenRecent = (path: string, name: string) => {
    // In next steps, App.tsx or ReaderPage should ideally read the DB to restore pageNumber,
    // but for now we simply open the document.
    onOpenDocument(path, name);
    navigate('/reader');
  };

  const handleOpenPdf = async () => {
    try {
      const filePath = await (window.api as any).openFileDialog()
      if (filePath) {
        const fileName = filePath.split(/[/\\]/).pop() || 'Document.pdf';
        onOpenDocument(filePath, fileName)
        navigate('/reader')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto w-full px-6 py-12">
      <div className="w-full max-w-4xl space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4 shadow-inner ring-1 ring-indigo-500/20">
            <FileText className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to Velora
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Read without strain. Focus without noise.
          </p>
        </section>

        {/* Primary Actions  */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-500/50"
            onClick={handleOpenPdf}
          >
            <FilePlus className="w-5 h-5" />
            Open PDF Document
          </button>
        </section>

        {/* Recent Documents */}
        <section className="space-y-6 pt-8">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground/90">Recent Documents</h2>
          </div>

          {recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDocs.map((doc) => {
                const progress = Math.max(0, Math.min(100, Math.round((doc.pageNumber / doc.totalPages) * 100))) || 0;
                
                return (
                  <div 
                    key={doc.id}
                    onClick={() => handleOpenRecent(doc.path, doc.name)}
                    className="group relative bg-card hover:bg-muted/50 border border-border p-4 rounded-xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <button 
                        onClick={(e) => handleRemoveDoc(e, doc.path)}
                        className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10" 
                        title="Remove from recent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-medium text-foreground truncate mb-1" title={doc.name}>
                      {doc.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{new Date(doc.lastOpened).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      <span>Page {doc.pageNumber} / {doc.totalPages}</span>
                    </div>

                    <div className="mt-auto">
                      <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <div className="text-[10px] text-right text-muted-foreground mt-1">{progress}% read</div>
                    </div>
                    
                    <div className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No recent documents found over the last month.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
