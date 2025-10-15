import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type {
  ReservationLookupRequest,
  ReservationLookupResponse,
} from '@/features/reservations/lookup/lib/dto';

export const useReservationLookup = () => {
  return useMutation({
    mutationFn: async (payload: ReservationLookupRequest) => {
      const response = await apiClient.post<{
        data: ReservationLookupResponse;
      }>('/api/reservations/lookup', payload);
      return response.data.data;
    },
    onError: (error) => {
      const message = extractApiErrorMessage(
        error,
        '예약 조회에 실패했습니다.',
      );
      console.error('Reservation lookup error:', message);
    },
  });
};
