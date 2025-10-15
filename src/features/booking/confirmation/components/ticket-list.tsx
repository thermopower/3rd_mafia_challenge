'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeatInfo } from '@/features/booking/confirmation/lib/dto';

interface TicketListProps {
  seats: SeatInfo[];
}

export const TicketList = ({ seats }: TicketListProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ko-KR').format(price);

  return (
    <Card>
      <CardHeader>
        <CardTitle>좌석 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {seats.map((seat) => (
            <div
              key={seat.seatId}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {seat.seatLabel}
                </p>
                <p className="text-xs text-gray-500">{seat.categoryName}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatPrice(seat.price)}원
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
