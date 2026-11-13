export default function OwnerLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-16 bg-stone-200/80 rounded-2xl" />

      {/* Hero Welcome Card Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-stone-200 rounded-lg" />
            <div className="h-4 w-72 bg-stone-100 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-stone-200 rounded-full" />
        </div>
        <div className="pt-4 border-t border-stone-100 flex gap-3">
          <div className="h-10 w-32 bg-stone-200 rounded-2xl" />
          <div className="h-10 w-28 bg-stone-100 rounded-2xl" />
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-2"
          >
            <div className="h-3 w-16 bg-stone-100 rounded" />
            <div className="h-7 w-12 bg-stone-200 rounded-md" />
            <div className="h-3 w-24 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs h-56 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-100" />
              <div className="h-5 w-32 bg-stone-200 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-3/4 bg-stone-100 rounded" />
            </div>
            <div className="h-9 w-36 bg-stone-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
