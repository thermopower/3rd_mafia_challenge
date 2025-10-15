"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { RecommendedConcertsResponse } from '@/features/home/lib/dto';
import { RecommendedConcertsResponseSchema } from '@/features/home/lib/dto';

export const useRecommendedConcerts = () => {
  return useQuery({
    queryKey: ['concerts', 'recommendations'],
    queryFn: async () => {
      const response = await apiClient.get<RecommendedConcertsResponse>(
        '/api/concerts/recommendations'
      );

      const parsed = RecommendedConcertsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid recommended concerts response schema');
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 15, // 15분
    retry: 1,
  });
};
