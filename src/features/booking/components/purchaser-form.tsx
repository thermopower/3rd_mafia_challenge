'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  onSubmit?: (values: PurchaserFormValues) => void;
  children?: (form: ReturnType<typeof useForm<PurchaserFormValues>>) => React.ReactNode;
}

export const PurchaserForm = ({
  defaultValues,
  isLoggedIn,
  onSubmit,
  children,
}: PurchaserFormProps) => {
  const form = useForm<PurchaserFormValues>({
    resolver: zodResolver(purchaserFormSchema),
    defaultValues: {
      bookerName: defaultValues?.bookerName ?? '',
      bookerEmail: defaultValues?.bookerEmail ?? '',
      bookerPhone: defaultValues?.bookerPhone ?? '',
    },
  });

  const handleSubmit = (values: PurchaserFormValues) => {
    onSubmit?.(values);
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
