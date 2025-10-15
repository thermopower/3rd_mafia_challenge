"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SeatReleaseRequestSchema,
  SeatReleaseResponseSchema,
  type SeatReleaseRequest,
  type SeatReleaseResponse,
} from '@/features/seat-selection/lib/dto';

export const useSeatReleaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SeatReleaseRequest) => {
      const validated = SeatReleaseRequestSchema.safeParse(request);

      if (!validated.success) {
        throw new Error('Invalid seat release request');
      }

      const response = await apiClient.delete<SeatReleaseResponse>(
        '/api/reservations/hold',
        {
          data: validated.data,
        }
      );

      const parsed = SeatReleaseResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid seat release response schema');
      }

      return parsed.data;
    },
    onSuccess: () => {
      // 좌석 지도를 무효화하여 선점 해제를 반영
      queryClient.invalidateQueries({
        queryKey: ['seat-map'],
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(
        error,
        '좌석 선점 해제에 실패했습니다.'
      );
      console.error('Seat release error:', message);
    },
  });
};
