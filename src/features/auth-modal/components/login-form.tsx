"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/common/contexts/auth-context";
import {
  LoginRequestSchema,
  type LoginRequest,
} from "@/features/auth/lib/dto";

export const LoginForm = () => {
  const { toast } = useToast();
  const { state, login, closeAuthModal } = useAuth();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    await login(data.email, data.password);

    if (state.error) {
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: state.error,
      });
    } else if (state.isLoggedIn) {
      toast({
        title: "로그인 성공",
        description: `환영합니다, ${state.currentUser?.name}님!`,
      });
      closeAuthModal();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  {...field}
                  disabled={state.isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  {...field}
                  disabled={state.isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={state.isLoading}
        >
          {state.isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          로그인
        </Button>
      </form>
    </Form>
  );
};
