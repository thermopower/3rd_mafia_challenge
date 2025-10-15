"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { useAuth } from "@/features/common/contexts/auth-context";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  SignupRequestSchema,
  type SignupRequest,
} from "@/features/auth/lib/dto";

type PageSignupFormProps = {
  redirectedFrom?: string;
};

export const PageSignupForm = ({ redirectedFrom }: PageSignupFormProps) => {
  const router = useRouter();
  const { refresh } = useCurrentUser();
  const { state, signup } = useAuth();

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
      toast.error(state.error);
    } else if (state.isLoggedIn) {
      await refresh();
      toast.success("회원가입이 완료되었습니다. 환영합니다!");
      const redirectTo = redirectedFrom ?? "/";
      router.push(redirectTo);
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
