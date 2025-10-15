'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookingTimerBadge } from './booking-timer-badge';
import type { BookingSessionResponse } from '../lib/dto';

interface BookingSummaryPanelProps {
  session: BookingSessionResponse;
  onExpire?: () => void;
}

export const BookingSummaryPanel = ({
  session,
  onExpire,
}: BookingSummaryPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">예매 정보</CardTitle>
          <BookingTimerBadge expiresAt={session.expiresAt} onExpire={onExpire} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.concertImageUrl && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={session.concertImageUrl}
              alt={session.concertTitle}
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold">{session.concertTitle}</h3>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            선택한 좌석
          </h4>
          <div className="flex gap-2 overflow-x-auto">
            {session.seats.map((seat) => (
              <Badge key={seat.id} variant="secondary" className="px-3 py-1.5 shrink-0">
                {seat.seatLabel}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {session.seats.map((seat) => (
            <div
              key={seat.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{seat.seatLabel}</span>
              <span className="font-medium">
                {seat.price.toLocaleString('ko-KR')}원
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">총 결제 금액</span>
          <span className="text-xl font-bold text-primary">
            {session.totalPrice.toLocaleString('ko-KR')}원
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
