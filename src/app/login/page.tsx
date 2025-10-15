"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAuthModal } from "@/features/auth-modal/hooks/useAuthModal";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentUser();
  const { openModal } = useAuthModal();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    } else {
      openModal("login", searchParams.get("redirectedFrom") ?? undefined);
      router.replace("/");
    }
  }, [isAuthenticated, router, searchParams, openModal]);

  return null;
}
