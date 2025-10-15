"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { PageSignupForm } from "@/features/auth/components/page-signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
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
          <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            TicketGem 계정을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PageSignupForm redirectedFrom={redirectedFrom} />

          <div className="text-center text-sm text-slate-600">
            <span>이미 계정이 있으신가요? </span>
            <Link
              href={redirectedFrom ? `/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}` : "/login"}
              className="text-blue-600 hover:underline font-medium"
            >
              로그인하기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
