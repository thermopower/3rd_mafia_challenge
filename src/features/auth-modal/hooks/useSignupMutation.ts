'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type {
  SignupRequest,
  AuthResponse,
} from '@/features/auth/lib/dto';

export const useSignupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignupRequest) => {
      const response = await apiClient.post<AuthResponse>(
        '/api/auth/signup',
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
        '회원가입에 실패했습니다.',
      );
      console.error('[useSignupMutation] Error:', errorMessage);
    },
  });
};
