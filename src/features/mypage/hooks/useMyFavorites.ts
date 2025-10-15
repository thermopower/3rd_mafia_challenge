"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import {
  MyFavoritesResponseSchema,
  type MyFavoritesResponse,
} from "@/features/mypage/lib/dto";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export const useMyFavorites = () => {
  return useSuspenseQuery({
    queryKey: ["mypage", "favorites"],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await apiClient.get<MyFavoritesResponse>(
        "/api/mypage/favorites",
        {
          headers: {
            Authorization: `Bearer ${session.user.id}`,
          },
        }
      );

      const parsed = MyFavoritesResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid favorites response schema");
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
