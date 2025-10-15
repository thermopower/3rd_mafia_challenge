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
  LoginRequestSchema,
  type LoginRequest,
} from "@/features/auth/lib/dto";

type PageLoginFormProps = {
  redirectedFrom?: string;
};

export const PageLoginForm = ({ redirectedFrom }: PageLoginFormProps) => {
  const router = useRouter();
  const { refresh } = useCurrentUser();
  const { state, login } = useAuth();

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
      toast.error(state.error);
    } else if (state.isLoggedIn) {
      await refresh();
      toast.success("로그인 성공! 환영합니다!");
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
