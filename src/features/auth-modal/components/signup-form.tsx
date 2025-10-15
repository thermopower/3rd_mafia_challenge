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
  SignupRequestSchema,
  type SignupRequest,
} from "@/features/auth/lib/dto";

export const SignupForm = () => {
  const { toast } = useToast();
  const { state, signup, closeAuthModal } = useAuth();

  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      contactPhone: "",
    },
  });

  const onSubmit = async (data: SignupRequest) => {
    await signup(data.email, data.password, data.fullName);

    if (state.error) {
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: state.error,
      });
    } else if (state.isLoggedIn) {
      toast({
        title: "회원가입 성공",
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
                  placeholder="8자 이상, 숫자와 특수문자 포함"
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="홍길동"
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
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>연락처 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="010-1234-5678"
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
          회원가입
        </Button>
      </form>
    </Form>
  );
};
