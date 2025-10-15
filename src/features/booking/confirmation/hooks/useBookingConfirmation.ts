'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { BookingConfirmationResponse } from '@/features/booking/confirmation/lib/dto';

/**
 * 예매 완료 정보를 조회하는 Suspense 기반 훅
 */
export const useBookingConfirmation = (orderId: string) => {
  return useSuspenseQuery<BookingConfirmationResponse>({
    queryKey: ['booking-confirmation', orderId],
    queryFn: async () => {
      const response = await apiClient.get<BookingConfirmationResponse>(
        `/api/reservations/${orderId}`,
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
};
