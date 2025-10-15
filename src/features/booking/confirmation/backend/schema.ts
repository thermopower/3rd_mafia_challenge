import { z } from 'zod';

// 요청: 예매 상세 조회 파라미터
export const BookingConfirmationParamsSchema = z.object({
  orderId: z.string().uuid({ message: 'Order ID must be a valid UUID.' }),
});

export type BookingConfirmationParams = z.infer<
  typeof BookingConfirmationParamsSchema
>;

// 응답: 좌석 정보
export const SeatInfoSchema = z.object({
  seatId: z.string().uuid(),
  seatLabel: z.string(),
  categoryName: z.string(),
  price: z.number(),
});

export type SeatInfo = z.infer<typeof SeatInfoSchema>;

// 응답: 예매 확정 정보
export const BookingConfirmationResponseSchema = z.object({
  orderId: z.string().uuid(),
  reservationNumber: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'expired']),
  confirmedAt: z.string().nullable(),
  bookerName: z.string(),
  bookerContact: z.string(),
  totalPrice: z.number(),

  // 공연 정보
  concert: z.object({
    id: z.string().uuid(),
    title: z.string(),
    thumbnailUrl: z.string(),
  }),

  // 좌석 목록
  seats: z.array(SeatInfoSchema),

  // 리디렉션 경로
  redirectTo: z.string().optional(),
});

export type BookingConfirmationResponse = z.infer<
  typeof BookingConfirmationResponseSchema
>;

// DB Row: reservation_orders
export const ReservationOrderRowSchema = z.object({
  id: z.string().uuid(),
  reservation_number: z.string(),
  concert_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'expired']),
  confirmed_at: z.string().nullable(),
  booker_name: z.string().nullable(),
  booker_contact: z.string().nullable(),
  total_price: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReservationOrderRow = z.infer<typeof ReservationOrderRowSchema>;

// DB Row: reservation_order_seats with joins
export const ReservationSeatRowSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  price: z.string(),
  is_active: z.boolean(),
  seat_label: z.string().nullable(),
  category_name: z.string().nullable(),
});

export type ReservationSeatRow = z.infer<typeof ReservationSeatRowSchema>;

// DB Row: concerts
export const ConcertRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

export type ConcertRow = z.infer<typeof ConcertRowSchema>;
