"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";
import { ConcertDetailResponseSchema } from "@/features/concert-detail/backend/schema";

export const useConcertDetail = (concertId: string) => {
  return useSuspenseQuery({
    queryKey: ["concert-detail", concertId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ConcertDetailResponse }>(
        `/api/concerts/${concertId}`
      );

      const parsed = ConcertDetailResponseSchema.safeParse(response.data.data);

      if (!parsed.success) {
        throw new Error("Invalid concert detail response schema");
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};
