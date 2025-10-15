"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { useConcertDetail } from "@/features/concert-detail/hooks/useConcertDetail";
import { ConcertDetailView } from "@/features/concert-detail/components/concert-detail-view";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function ConcertDetailContent() {
  const params = useParams();
  const concertId = params.concertId as string;

  const { data: concert } = useConcertDetail(concertId);

  return <ConcertDetailView concert={concert} />;
}

function ConcertDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Skeleton */}
          <div className="space-y-6">
            <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">
            {error.message || "콘서트 정보를 불러올 수 없습니다."}
          </p>
        </div>
        <Button onClick={resetErrorBoundary} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}

export default function ConcertDetailPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<ConcertDetailSkeleton />}>
        <ConcertDetailContent />
      </Suspense>
    </ErrorBoundary>
  );
}
