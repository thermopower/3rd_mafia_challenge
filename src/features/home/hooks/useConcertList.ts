"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type {
  ConcertListQuery,
  ConcertListResponse,
} from '@/features/home/lib/dto';
import { ConcertListResponseSchema } from '@/features/home/lib/dto';

export const useConcertList = (filters: Partial<ConcertListQuery> = {}) => {
  return useQuery({
    queryKey: ['concerts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await apiClient.get<ConcertListResponse>(
        `/api/concerts?${params.toString()}`
      );

      const parsed = ConcertListResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid concert list response schema');
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: 1,
  });
};
