"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { MyPageView } from "@/features/mypage/components/my-page-view";
import { useAuth } from "@/features/common/contexts/auth-context";

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCurrentUser();
  const { openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal("login", "/mypage");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router, openAuthModal]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MyPageView />;
}
