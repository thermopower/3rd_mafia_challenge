import { z } from 'zod';

export const ReservationLookupRequestSchema = z.object({
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

export type ReservationLookupRequest = z.infer<
  typeof ReservationLookupRequestSchema
>;

export const ReservationSeatSchema = z.object({
  seatLabel: z.string(),
  categoryName: z.string(),
  price: z.number(),
});

export const ReservationLookupResponseSchema = z.object({
  reservationNumber: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED']),
  concert: z.object({
    id: z.string().uuid(),
    title: z.string(),
    thumbnailUrl: z.string(),
  }),
  seats: z.array(ReservationSeatSchema),
  bookerName: z.string(),
  bookerContact: z.string(),
  totalPrice: z.number(),
  confirmedAt: z.string().nullable(),
  holdExpiresAt: z.string().nullable(),
});

export type ReservationLookupResponse = z.infer<
  typeof ReservationLookupResponseSchema
>;
