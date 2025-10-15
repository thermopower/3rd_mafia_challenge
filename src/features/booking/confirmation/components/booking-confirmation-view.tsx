'use client';

import { useBookingConfirmation } from '@/features/booking/confirmation/hooks/useBookingConfirmation';
import { ConfirmationHeader } from '@/features/booking/confirmation/components/confirmation-header';
import { OrderSummaryCard } from '@/features/booking/confirmation/components/order-summary-card';
import { ConcertInfoCard } from '@/features/booking/confirmation/components/concert-info-card';
import { TicketList } from '@/features/booking/confirmation/components/ticket-list';
import { NextActionPanel } from '@/features/booking/confirmation/components/next-action-panel';

interface BookingConfirmationViewProps {
  orderId: string;
}

export const BookingConfirmationView = ({
  orderId,
}: BookingConfirmationViewProps) => {
  const { data } = useBookingConfirmation(orderId);

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <ConfirmationHeader />

      <OrderSummaryCard
        reservationNumber={data.reservationNumber}
        confirmedAt={data.confirmedAt}
        totalPrice={data.totalPrice}
      />

      <ConcertInfoCard concert={data.concert} />

      <TicketList seats={data.seats} />

      <NextActionPanel />
    </div>
  );
};
