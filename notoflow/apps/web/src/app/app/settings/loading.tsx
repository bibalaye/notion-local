export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2 border-b border-border/30 pb-4">
        <div className="h-8 bg-muted/30 rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-muted/20 rounded w-1/2 animate-pulse" />
      </div>

      {/* Settings sections skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-6 border border-border/30 rounded-xl bg-card/50">
            <div className="h-5 bg-muted/30 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-muted/20 rounded w-2/3 animate-pulse" />
            <div className="h-10 bg-muted/30 rounded-lg w-full animate-pulse mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
