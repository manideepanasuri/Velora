import { Maximize } from 'lucide-react';

export function FloatingNav() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md border border-border rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl">
      <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
        <span className="sr-only">Previous Page</span>
        &larr;
      </button>
      <div className="text-sm font-medium flex items-center">
        <input 
          type="text" 
          defaultValue="1" 
          className="w-10 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1" 
        />
        <span className="text-muted-foreground mx-1">/</span>
        <span className="text-muted-foreground">342</span>
      </div>
      <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
        <span className="sr-only">Next Page</span>
        &rarr;
      </button>
      <div className="w-[1px] h-4 bg-border mx-2"></div>
      <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted" title="Fullscreen">
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  );
}
