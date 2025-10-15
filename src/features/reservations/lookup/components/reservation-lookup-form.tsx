'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReservationLookupRequest } from '@/features/reservations/lookup/lib/dto';

const formSchema = z.object({
  orderNumber: z
    .string()
    .min(12, { message: '예약 번호는 최소 12자 이상이어야 합니다.' })
    .max(16, { message: '예약 번호는 최대 16자 이하여야 합니다.' })
    .regex(/^[A-Za-z0-9]+$/, {
      message: '예약 번호는 영문자와 숫자만 포함해야 합니다.',
    }),
  contact: z
    .string()
    .min(1, { message: '연락처를 입력해주세요.' })
    .regex(/^[0-9-+() ]+$/, {
      message: '유효한 연락처 형식을 입력해주세요.',
    }),
});

interface ReservationLookupFormProps {
  onSubmit: (data: ReservationLookupRequest) => void;
  isLoading?: boolean;
}

export function ReservationLookupForm({
  onSubmit,
  isLoading = false,
}: ReservationLookupFormProps) {
  const form = useForm<ReservationLookupRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      contact: '',
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>예약 조회</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>예약 번호</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: ABC123DEF456"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 010-1234-5678"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  조회 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  조회하기
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
