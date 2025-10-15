"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type {
  FavoriteToggleRequest,
  FavoriteToggleResponse,
} from "@/features/favorites/backend/schema";
import { FavoriteToggleResponseSchema } from "@/features/favorites/backend/schema";
import { useToast } from "@/hooks/use-toast";

export const useFavoriteToggle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: FavoriteToggleRequest) => {
      const response = await apiClient.post<FavoriteToggleResponse>(
        "/api/favorites/toggle",
        request
      );

      const parsed = FavoriteToggleResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid favorite toggle response schema");
      }

      return parsed.data;
    },
    onSuccess: (data, variables) => {
      // 콘서트 상세 캐시 업데이트 (optimistic update)
      queryClient.setQueryData(
        ["concert-detail", variables.concertId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isFavorite: data.isFavorite,
          };
        }
      );

      // 메트릭스 캐시 무효화하여 최신 찜 수를 반영
      queryClient.invalidateQueries({
        queryKey: ["concert-metrics", variables.concertId],
      });

      // 콘서트 목록 캐시 무효화 (찜 상태 반영)
      queryClient.invalidateQueries({
        queryKey: ["concerts"],
      });

      toast({
        title: data.isFavorite ? "찜 목록에 추가했습니다" : "찜 목록에서 제거했습니다",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "요청 실패",
        description:
          error instanceof Error
            ? error.message
            : "찜하기 요청에 실패했습니다.",
        variant: "destructive",
      });
    },
  });
};
