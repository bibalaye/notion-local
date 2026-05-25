export default function PageLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Page header skeleton */}
      <div className="border-b border-border/30 px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted/30 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted/30 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-muted/20 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Title skeleton */}
          <div className="h-12 bg-muted/30 rounded-lg w-2/3 animate-pulse" />
          
          {/* Content blocks skeleton */}
          <div className="space-y-3 mt-8">
            <div className="h-4 bg-muted/20 rounded w-full animate-pulse" />
            <div className="h-4 bg-muted/20 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-muted/20 rounded w-4/5 animate-pulse" />
            
            <div className="h-32 bg-muted/30 rounded-xl mt-6 animate-pulse" />
            
            <div className="h-4 bg-muted/20 rounded w-full animate-pulse mt-6" />
            <div className="h-4 bg-muted/20 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
