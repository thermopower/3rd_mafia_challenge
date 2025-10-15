"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton = ({ count = 3 }: ListSkeletonProps) => {
  return (
    <div className="space-y-4" aria-label="로딩 중" role="status">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 p-4 border rounded-lg bg-card"
          aria-hidden="true"
        >
          <Skeleton className="w-32 h-24 flex-shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
