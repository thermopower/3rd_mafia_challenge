'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import {
  BookingSessionResponseSchema,
  type BookingSessionResponse,
} from '../lib/dto';

const fetchBookingSession = async (holdId?: string): Promise<BookingSessionResponse> => {
  const { data } = await apiClient.get('/api/reservations/current', {
    headers: holdId ? { 'x-hold-id': holdId } : undefined,
  });

  const parsed = BookingSessionResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid booking session data received');
  }

  return parsed.data;
};

export const useBookingSession = () => {
  const holdInfo = useSelectedSeatsStore((state) => state.holdInfo);

  return useQuery({
    queryKey: ['booking-session', holdInfo?.holdId],
    queryFn: () => fetchBookingSession(holdInfo?.holdId),
    staleTime: 1000 * 60,
    retry: 1,
  });
};
