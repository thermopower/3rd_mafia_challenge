'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BookingConfirmationResponse } from '@/features/booking/confirmation/lib/dto';

interface ConcertInfoCardProps {
  concert: BookingConfirmationResponse['concert'];
}

export const ConcertInfoCard = ({ concert }: ConcertInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>공연 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={concert.thumbnailUrl}
              alt={concert.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {concert.title}
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
