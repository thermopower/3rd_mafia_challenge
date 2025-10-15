import { z } from 'zod';

// 좌석 정보 스키마
export const BookingSeatSchema = z.object({
  id: z.string().uuid(),
  seatLabel: z.string(),
  price: z.number(),
});

export type BookingSeat = z.infer<typeof BookingSeatSchema>;

// 현재 선점 정보 조회 응답
export const BookingSessionResponseSchema = z.object({
  holdId: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertImageUrl: z.string().optional(),
  seats: z.array(BookingSeatSchema),
  totalPrice: z.number(),
  expiresAt: z.string(),
  isLoggedIn: z.boolean(),
  prefillData: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export type BookingSessionResponse = z.infer<
  typeof BookingSessionResponseSchema
>;

// 예매 정보 입력 요청 (사전 검증)
export const BookingPreviewRequestSchema = z.object({
  holdId: z.string().uuid(),
  bookerName: z.string().min(1, '이름을 입력해주세요.'),
  bookerEmail: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  bookerPhone: z
    .string()
    .regex(/^010-?\d{4}-?\d{4}$/, '올바른 전화번호 형식을 입력해주세요.'),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: '필수 약관에 동의해주세요.',
  }),
});

export type BookingPreviewRequest = z.infer<
  typeof BookingPreviewRequestSchema
>;

// 예매 사전 검증 응답
export const BookingPreviewResponseSchema = z.object({
  valid: z.boolean(),
  message: z.string(),
});

export type BookingPreviewResponse = z.infer<
  typeof BookingPreviewResponseSchema
>;

// 예매 확정 요청
export const BookingConfirmRequestSchema = z.object({
  holdId: z.string().uuid(),
  bookerName: z.string().min(1),
  bookerEmail: z.string().email(),
  bookerPhone: z.string().regex(/^010-?\d{4}-?\d{4}$/),
  agreedToTerms: z.boolean().refine((val) => val === true),
});

export type BookingConfirmRequest = z.infer<typeof BookingConfirmRequestSchema>;

// 예매 확정 응답
export const BookingConfirmResponseSchema = z.object({
  orderId: z.string().uuid(),
  reservationNumber: z.string(),
  redirectTo: z.string(),
});

export type BookingConfirmResponse = z.infer<
  typeof BookingConfirmResponseSchema
>;

// DB row 스키마
export const ReservationOrderRowSchema = z.object({
  id: z.string().uuid(),
  reservation_number: z.string(),
  concert_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'expired']),
  hold_expires_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  booker_name: z.string().nullable(),
  booker_contact: z.string().nullable(),
  total_price: z.string().or(z.number()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReservationOrderRow = z.infer<typeof ReservationOrderRowSchema>;

export const ReservationOrderSeatRowSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  price: z.string().or(z.number()),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type ReservationOrderSeatRow = z.infer<
  typeof ReservationOrderSeatRowSchema
>;
