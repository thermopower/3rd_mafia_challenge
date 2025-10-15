'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, User, Phone, Copy, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ReservationStatusBadge } from './reservation-status-badge';
import type { ReservationLookupResponse } from '@/features/reservations/lookup/lib/dto';
import { useToast } from '@/hooks/use-toast';

interface ReservationResultCardProps {
  reservation: ReservationLookupResponse;
  onReset: () => void;
}

export function ReservationResultCard({
  reservation,
  onReset,
}: ReservationResultCardProps) {
  const { toast } = useToast();

  const handleCopyReservationNumber = () => {
    navigator.clipboard.writeText(reservation.reservationNumber);
    toast({
      title: '복사 완료',
      description: '예약 번호가 클립보드에 복사되었습니다.',
    });
  };

  const formattedTotalPrice = new Intl.NumberFormat('ko-KR').format(
    reservation.totalPrice,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">예약 조회 결과</CardTitle>
            <p className="text-sm text-muted-foreground">
              예약 번호: {reservation.reservationNumber}
            </p>
          </div>
          <ReservationStatusBadge status={reservation.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-lg">
          <img
            src={reservation.concert.thumbnailUrl}
            alt={reservation.concert.title}
            className="h-48 w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {reservation.concert.title}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {reservation.confirmedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    예약 확정:{' '}
                    {format(
                      new Date(reservation.confirmedAt),
                      'yyyy년 M월 d일 HH:mm',
                      {
                        locale: ko,
                      },
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 font-semibold">좌석 정보</h4>
            <div className="space-y-2">
              {reservation.seats.map((seat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {seat.categoryName} - {seat.seatLabel}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('ko-KR').format(seat.price)}원
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 font-semibold">예약자 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{reservation.bookerName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{reservation.bookerContact}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
            <span className="text-base font-semibold">총 결제 금액</span>
            <span className="text-xl font-bold text-primary">
              {formattedTotalPrice}원
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopyReservationNumber}
          >
            <Copy className="mr-2 h-4 w-4" />
            예약 번호 복사
          </Button>
          <Button variant="outline" className="flex-1" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            다시 조회하기
          </Button>
        </div>

        {reservation.status === 'PENDING' && reservation.holdExpiresAt && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-medium">결제 대기 중</p>
            <p className="mt-1">
              {format(
                new Date(reservation.holdExpiresAt),
                'yyyy년 M월 d일 HH:mm',
                {
                  locale: ko,
                },
              )}
              까지 결제를 완료해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
