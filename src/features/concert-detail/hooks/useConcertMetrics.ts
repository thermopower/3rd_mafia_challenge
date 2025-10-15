"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type { ConcertMetricsResponse } from "@/features/concert-detail/lib/dto";
import { ConcertMetricsResponseSchema } from "@/features/concert-detail/backend/schema";

export const useConcertMetrics = (concertId: string) => {
  return useQuery({
    queryKey: ["concert-metrics", concertId],
    queryFn: async () => {
      const response = await apiClient.get<ConcertMetricsResponse>(
        `/api/concerts/${concertId}/metrics`
      );

      const parsed = ConcertMetricsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid concert metrics response schema");
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: 1,
  });
};
