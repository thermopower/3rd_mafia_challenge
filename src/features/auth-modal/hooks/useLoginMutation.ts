'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type {
  LoginRequest,
  AuthResponse,
} from '@/features/auth/lib/dto';

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const response = await apiClient.post<AuthResponse>(
        '/api/auth/login',
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (error) => {
      const errorMessage = extractApiErrorMessage(
        error,
        '로그인에 실패했습니다.',
      );
      console.error('[useLoginMutation] Error:', errorMessage);
    },
  });
};
