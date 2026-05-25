export default function DatabasesLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2 border-b border-border/30 pb-4">
        <div className="h-8 bg-muted/30 rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-muted/20 rounded w-1/2 animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 bg-muted/30 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
