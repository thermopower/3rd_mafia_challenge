'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  BookingSessionResponseSchema,
  type BookingSessionResponse,
} from '../lib/dto';

const fetchBookingSession = async (): Promise<BookingSessionResponse> => {
  const { data } = await apiClient.get('/api/reservations/current');

  const parsed = BookingSessionResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid booking session data received');
  }

  return parsed.data;
};

export const useBookingSession = () => {
  return useQuery({
    queryKey: ['booking-session'],
    queryFn: fetchBookingSession,
    staleTime: 1000 * 60,
    retry: 1,
  });
};
