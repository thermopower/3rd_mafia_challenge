"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthModal } from "@/features/auth-modal/hooks/useAuthModal";
import { LoginForm } from "@/features/auth-modal/components/login-form";
import { SignupForm } from "@/features/auth-modal/components/signup-form";
import { AuthFormFooter } from "@/features/auth-modal/components/auth-form-footer";

export const AuthModal = () => {
  const { isOpen, mode, closeModal, switchMode } = useAuthModal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "로그인" : "회원가입"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "TicketGem에 로그인하여 더 많은 서비스를 이용하세요."
              : "TicketGem에 가입하고 콘서트 예매를 시작하세요."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => switchMode(value as "login" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <LoginForm />
            <AuthFormFooter mode="login" />
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <SignupForm />
            <AuthFormFooter mode="signup" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
