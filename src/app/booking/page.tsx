'use client';

import { Suspense } from 'react';
import { BookingLayout } from '@/features/booking/components/booking-layout';
import { Skeleton } from '@/components/ui/skeleton';

const BookingPageContent = () => {
  return <BookingLayout />;
};

const BookingPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    </div>
  );
};

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookingPageContent />
    </Suspense>
  );
}
