'use client';

import { ReservationLookupView } from '@/features/reservations/lookup/components/reservation-lookup-view';

export default function ReservationLookupPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">예약 조회</h1>
        <p className="text-muted-foreground">
          예약 번호와 연락처로 예약 내역을 확인하세요
        </p>
      </div>

      <ReservationLookupView />
    </div>
  );
}
