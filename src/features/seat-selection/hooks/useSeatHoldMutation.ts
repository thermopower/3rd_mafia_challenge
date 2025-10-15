"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SeatHoldRequestSchema,
  SeatHoldResponseSchema,
  type SeatHoldRequest,
  type SeatHoldResponse,
} from '@/features/seat-selection/lib/dto';

export const useSeatHoldMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SeatHoldRequest) => {
      const validated = SeatHoldRequestSchema.safeParse(request);

      if (!validated.success) {
        throw new Error('Invalid seat hold request');
      }

      const response = await apiClient.post<SeatHoldResponse>(
        '/api/reservations/hold',
        validated.data
      );

      const parsed = SeatHoldResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid seat hold response schema');
      }

      return parsed.data;
    },
    onSuccess: (data, variables) => {
      // 좌석 지도를 무효화하여 다른 사용자의 선점 상태를 반영
      queryClient.invalidateQueries({
        queryKey: ['seat-map', variables.concertId],
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(
        error,
        '좌석 선점에 실패했습니다. 다시 시도해주세요.'
      );
      console.error('Seat hold error:', message);
    },
  });
};
