"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import {
  MyReservationsResponseSchema,
  type MyReservationsResponse,
} from "@/features/mypage/lib/dto";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export const useMyReservations = () => {
  return useSuspenseQuery({
    queryKey: ["mypage", "reservations"],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await apiClient.get<{ data: MyReservationsResponse }>(
        "/api/mypage/reservations",
        {
          headers: {
            Authorization: `Bearer ${session.user.id}`,
          },
        }
      );

      const parsed = MyReservationsResponseSchema.safeParse(
        response.data.data
      );

      if (!parsed.success) {
        throw new Error("Invalid reservations response schema");
      }

      return parsed.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
