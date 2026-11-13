export default function PublicMenuLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      <div className="max-w-xl mx-auto flex flex-col">
        {/* Hero skeleton */}
        <div className="w-full h-64 bg-stone-300 animate-pulse rounded-b-3xl" />

        {/* Search bar skeleton */}
        <div className="p-4 space-y-3">
          <div className="h-10 bg-stone-200 animate-pulse rounded-2xl w-full" />
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-stone-200 animate-pulse rounded-full" />
            <div className="h-7 w-24 bg-stone-200 animate-pulse rounded-full" />
            <div className="h-7 w-24 bg-stone-200 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Category skeleton */}
        <div className="px-4 py-2 flex gap-2">
          <div className="h-8 w-28 bg-stone-200 animate-pulse rounded-full" />
          <div className="h-8 w-28 bg-stone-200 animate-pulse rounded-full" />
          <div className="h-8 w-28 bg-stone-200 animate-pulse rounded-full" />
        </div>

        {/* Item cards skeleton */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 bg-white border border-stone-200/60 rounded-2xl p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/2 bg-stone-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-stone-200 rounded-full self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

