"use client";

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SeatMapResponseSchema,
  type SeatMapResponse,
} from '@/features/seat-selection/lib/dto';

interface UseSeatMapParams {
  concertId: string;
  scheduleId?: string;
}

export const useSeatMap = ({ concertId, scheduleId }: UseSeatMapParams) => {
  return useSuspenseQuery({
    queryKey: ['seat-map', concertId, scheduleId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (scheduleId) {
        params.append('scheduleId', scheduleId);
      }

      const queryString = params.toString();
      const url = `/api/concerts/${concertId}/seats${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<SeatMapResponse>(url);

      const parsed = SeatMapResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid seat map response schema');
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 5, // 5분
    retry: 1,
  });
};
