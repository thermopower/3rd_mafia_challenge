'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const purchaserFormSchema = z.object({
  bookerName: z.string().min(1, '이름을 입력해주세요.'),
  bookerEmail: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  bookerPhone: z
    .string()
    .regex(/^010-?\d{4}-?\d{4}$/, '올바른 전화번호 형식을 입력해주세요.'),
});

export type PurchaserFormValues = z.infer<typeof purchaserFormSchema>;

interface PurchaserFormProps {
  defaultValues?: Partial<PurchaserFormValues>;
  isLoggedIn?: boolean;
  onValuesChange?: (values: PurchaserFormValues | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  children?: (form: ReturnType<typeof useForm<PurchaserFormValues>>) => React.ReactNode;
}

export const PurchaserForm = ({
  defaultValues,
  isLoggedIn,
  onValuesChange,
  onValidityChange,
  children,
}: PurchaserFormProps) => {
  const form = useForm<PurchaserFormValues>({
    resolver: zodResolver(purchaserFormSchema),
    defaultValues: {
      bookerName: defaultValues?.bookerName ?? '',
      bookerEmail: defaultValues?.bookerEmail ?? '',
      bookerPhone: defaultValues?.bookerPhone ?? '',
    },
    mode: 'onChange', // 입력할 때마다 validation 실행
  });

  // 이전 defaultValues를 추적
  const prevDefaultValuesRef = useRef<Partial<PurchaserFormValues> | undefined>();

  // defaultValues가 실제로 변경되었을 때만 폼 리셋
  useEffect(() => {
    if (!defaultValues) return;

    const prev = prevDefaultValuesRef.current;

    // 이전 값과 비교해서 실제로 변경되었을 때만 reset
    const hasChanged =
      !prev ||
      prev.bookerName !== defaultValues.bookerName ||
      prev.bookerEmail !== defaultValues.bookerEmail ||
      prev.bookerPhone !== defaultValues.bookerPhone;

    if (hasChanged) {
      form.reset({
        bookerName: defaultValues.bookerName ?? '',
        bookerEmail: defaultValues.bookerEmail ?? '',
        bookerPhone: defaultValues.bookerPhone ?? '',
      });
      prevDefaultValuesRef.current = defaultValues;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.bookerName, defaultValues?.bookerEmail, defaultValues?.bookerPhone]);

  // 폼 값이 변경될 때마다 실시간으로 추적
  useEffect(() => {
    const subscription = form.watch((values) => {
      // 모든 필수 필드가 채워졌는지 확인
      if (values.bookerName && values.bookerEmail && values.bookerPhone) {
        onValuesChange?.(values as PurchaserFormValues);
      } else {
        onValuesChange?.(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // validation 상태가 변경될 때마다 알림
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.isValid]);

  const handleSubmit = (values: PurchaserFormValues) => {
    onValuesChange?.(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isLoggedIn ? '예매자 정보 확인' : '예매자 정보 입력'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bookerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일 *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전화번호 *</FormLabel>
                  <FormControl>
                    <Input placeholder="010-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {children?.(form)}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
