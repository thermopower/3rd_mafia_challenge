'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookingConfirmationView } from '@/features/booking/confirmation/components/booking-confirmation-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const BookingConfirmationSkeleton = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col items-center justify-center py-8">
        <Skeleton className="mb-4 h-16 w-16 rounded-full" />
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-6 w-48" />
      </div>

      {[1, 2, 3, 4].map((index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="mb-2 h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const BookingConfirmationError = ({ error }: { error: Error }) => {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <AlertCircle
        className="mb-4 text-red-500"
        size={64}
      />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        예매 정보를 불러올 수 없습니다
      </h1>
      <p className="mb-6 text-gray-600">
        {error.message || '예매 정보를 확인하는 중 오류가 발생했습니다.'}
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
        >
          메인으로
        </Button>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    </div>
  );
};

const BookingConfirmationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    router.push('/');
    return null;
  }

  return <BookingConfirmationView orderId={orderId} />;
};

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<BookingConfirmationSkeleton />}>
      <BookingConfirmationContent />
    </Suspense>
  );
}
