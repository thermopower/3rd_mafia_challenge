"use client";

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  SeatSelectionView,
  SeatSelectionViewSkeleton,
  SeatSelectionViewError,
} from '@/features/seat-selection/components/seat-selection-view';
import { ErrorBoundary } from 'react-error-boundary';

const SeatSelectionPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const concertId = params.concertId as string;
  const scheduleId = searchParams.get('scheduleId') ?? undefined;

  return (
    <ErrorBoundary FallbackComponent={SeatSelectionViewError}>
      <Suspense fallback={<SeatSelectionViewSkeleton />}>
        <SeatSelectionView concertId={concertId} scheduleId={scheduleId} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default function SeatSelectionPage() {
  return <SeatSelectionPageContent />;
}
