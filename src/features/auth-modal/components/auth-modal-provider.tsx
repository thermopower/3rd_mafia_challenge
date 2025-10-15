"use client";

import { AuthModal } from "@/features/auth-modal/components/auth-modal";

type AuthModalProviderProps = {
  children: React.ReactNode;
};

export const AuthModalProvider = ({ children }: AuthModalProviderProps) => {
  return (
    <>
      {children}
      <AuthModal />
    </>
  );
};
