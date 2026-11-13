export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#8B4A27]/10 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-2 border-[#8B4A27] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1.5 w-full">
          <div className="h-4 bg-stone-200 rounded-md w-1/2 mx-auto animate-pulse" />
          <div className="h-3 bg-stone-100 rounded-md w-3/4 mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
}
