"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type {
  FavoriteToggleRequest,
  FavoriteToggleResponse,
} from '@/features/favorites/lib/dto';
import { FavoriteToggleResponseSchema } from '@/features/favorites/lib/dto';
import type { ConcertListResponse } from '@/features/home/lib/dto';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

interface UseFavoriteToggleOptions {
  onSuccess?: (isFavorite: boolean) => void;
  onError?: (error: string) => void;
  onUnauthorized?: () => void;
}

export const useFavoriteToggle = (options?: UseFavoriteToggleOptions) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCurrentUser();

  return useMutation({
    mutationFn: async (request: FavoriteToggleRequest) => {
      // 로그인 체크
      if (!isAuthenticated) {
        throw new Error('UNAUTHORIZED');
      }

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('UNAUTHORIZED');
      }

      const response = await apiClient.post<FavoriteToggleResponse>(
        '/api/favorites/toggle',
        request,
        {
          headers: {
            Authorization: `Bearer ${session.user.id}`,
          },
        }
      );

      const parsed = FavoriteToggleResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid favorite toggle response schema');
      }

      return parsed.data;
    },
    onSuccess: (data, variables) => {
      // 공연 목록 캐시 업데이트 (optimistic update)
      queryClient.setQueriesData<ConcertListResponse>(
        { queryKey: ['concerts'] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            concerts: old.concerts.map((concert) =>
              concert.id === variables.concertId
                ? { ...concert, isFavorite: data.isFavorite }
                : concert
            ),
          };
        }
      );

      // 추천 공연 캐시 업데이트
      queryClient.setQueriesData<{ concerts: any[] }>(
        { queryKey: ['concerts', 'recommendations'] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            concerts: old.concerts.map((concert) =>
              concert.id === variables.concertId
                ? { ...concert, isFavorite: data.isFavorite }
                : concert
            ),
          };
        }
      );

      if (options?.onSuccess) {
        options.onSuccess(data.isFavorite);
      }
    },
    onError: (error: unknown) => {
      const errorMessage = extractApiErrorMessage(error);

      if (errorMessage === 'UNAUTHORIZED' && options?.onUnauthorized) {
        options.onUnauthorized();
        return;
      }

      if (options?.onError) {
        options.onError(errorMessage);
      }
    },
  });
};
