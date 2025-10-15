"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/common/contexts/auth-context";
import { LoginForm } from "@/features/auth-modal/components/login-form";
import { SignupForm } from "@/features/auth-modal/components/signup-form";
import { AuthFormFooter } from "@/features/auth-modal/components/auth-form-footer";

export const AuthModal = () => {
  const { state, closeAuthModal, switchAuthMode } = useAuth();

  return (
    <Dialog open={state.showAuthModal} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {state.authModalMode === "login" ? "로그인" : "회원가입"}
          </DialogTitle>
          <DialogDescription>
            {state.authModalMode === "login"
              ? "TicketGem에 로그인하여 더 많은 서비스를 이용하세요."
              : "TicketGem에 가입하고 콘서트 예매를 시작하세요."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={state.authModalMode}
          onValueChange={(value) => switchAuthMode(value as "login" | "signup")}
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
