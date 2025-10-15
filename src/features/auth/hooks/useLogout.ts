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
      // 홈페이지로 리다이렉트
      router.push('/');
      // 페이지 새로고침하여 서버 세션 초기화
      router.refresh();
    },
  });
};
