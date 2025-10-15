"use client";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { MyPageTabs } from "./my-page-tabs";
import { User } from "lucide-react";

export const MyPageView = () => {
  const { user } = useCurrentUser();

  const userEmail = user?.email || "사용자";
  const displayName = userEmail.split("@")[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {displayName}님의 마이페이지
            </h1>
            <p className="text-sm text-muted-foreground">
              예매 내역과 찜한 공연을 관리하세요
            </p>
          </div>
        </div>
      </div>

      <MyPageTabs />
    </div>
  );
};
