"use client";

export const HomeSkeleton = () => {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Search Section Skeleton */}
      <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-8 bg-slate-300 rounded w-1/3 mx-auto" />
          <div className="h-12 bg-white rounded-lg w-full" />
          <div className="flex gap-2 justify-center flex-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-300 rounded-full w-20" />
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Section Skeleton */}
      <div className="space-y-4">
        <div className="h-7 bg-slate-200 rounded w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5.6] bg-slate-200 rounded-lg" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* All Concerts Section Skeleton */}
      <div className="space-y-4">
        <div className="h-7 bg-slate-200 rounded w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5.6] bg-slate-200 rounded-lg" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
