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
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { useAuthModal } from "@/features/auth-modal/hooks/useAuthModal";
import { useSignupMutation } from "@/features/auth-modal/hooks/useSignupMutation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  SignupRequestSchema,
  type SignupRequest,
} from "@/features/auth/lib/dto";

export const SignupForm = () => {
  const { toast } = useToast();
  const { closeModal } = useAuthModal();
  const { refresh } = useCurrentUser();
  const signupMutation = useSignupMutation();

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
    try {
      await signupMutation.mutateAsync(data);
      // 현재 사용자 정보 갱신
      await refresh();
      toast({
        title: "회원가입 성공",
        description: "회원가입이 완료되었습니다. 환영합니다!",
      });
      closeModal();
    } catch (error) {
      const errorMessage = extractApiErrorMessage(
        error,
        "회원가입에 실패했습니다."
      );
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: errorMessage,
      });
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
                  disabled={signupMutation.isPending}
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
                  disabled={signupMutation.isPending}
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
                  disabled={signupMutation.isPending}
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
                  disabled={signupMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          회원가입
        </Button>
      </form>
    </Form>
  );
};
