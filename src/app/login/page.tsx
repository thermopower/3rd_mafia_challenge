"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { PageLoginForm } from "@/features/auth/components/page-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  if (isAuthenticated) {
    return null;
  }

  const redirectedFrom = searchParams.get("redirectedFrom") ?? undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            TicketGem에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PageLoginForm redirectedFrom={redirectedFrom} />

          <div className="text-center text-sm text-slate-600">
            <span>계정이 없으신가요? </span>
            <Link
              href={redirectedFrom ? `/signup?redirectedFrom=${encodeURIComponent(redirectedFrom)}` : "/signup"}
              className="text-blue-600 hover:underline font-medium"
            >
              회원가입하기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
