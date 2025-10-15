'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  BookingConfirmResponseSchema,
  type BookingConfirmRequest,
  type BookingConfirmResponse,
} from '../lib/dto';

const confirmBooking = async (
  request: BookingConfirmRequest,
): Promise<BookingConfirmResponse> => {
  const { data } = await apiClient.post('/api/reservations/confirm', request);

  const parsed = BookingConfirmResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid confirm response');
  }

  return parsed.data;
};

export const useBookingConfirm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-session'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['mypage'] });

      router.push(data.redirectTo);
    },
  });
};
