export default function AppLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-muted/30 rounded-lg w-1/3 animate-pulse" />
          <div className="h-4 bg-muted/20 rounded w-2/3 animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3 mt-8">
          <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-24 bg-muted/20 rounded-xl animate-pulse" />
          <div className="h-40 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
