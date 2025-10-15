import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    .regex(/[0-9]/, { message: '비밀번호는 숫자를 포함해야 합니다.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: '비밀번호는 특수문자를 포함해야 합니다.',
    }),
  fullName: z
    .string()
    .min(1, { message: '이름을 입력해주세요.' })
    .max(100, { message: '이름은 100자 이하여야 합니다.' }),
  contactPhone: z
    .string()
    .regex(/^[0-9-+() ]+$/, {
      message: '유효한 전화번호 형식을 입력해주세요.',
    })
    .optional(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().nullable(),
  }),
  message: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LogoutResponseSchema = z.object({
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
