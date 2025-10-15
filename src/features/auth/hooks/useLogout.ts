'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/remote/api-client';
import type { LogoutResponse } from '@/features/auth/lib/dto';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<LogoutResponse>(
        '/api/auth/logout',
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      // 현재 사용자 정보 무효화
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      // 홈페이지로 완전 리로드 (로그인 상태 UI 즉시 반영)
      window.location.href = '/';
    },
  });
};
