export default function HotelsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-10 w-96 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-slate-200 rounded-md animate-pulse" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-14 bg-white rounded-2xl border border-slate-200 p-3 flex gap-3 animate-pulse">
        <div className="h-full w-48 bg-slate-200 rounded-lg" />
        <div className="h-full w-36 bg-slate-200 rounded-lg" />
        <div className="h-full w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden space-y-4 p-4 shadow-sm animate-pulse"
          >
            <div className="h-52 w-full bg-slate-200 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-28 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
