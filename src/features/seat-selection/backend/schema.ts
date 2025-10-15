import { z } from 'zod';

// 좌석 상태 enum
export const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  ON_HOLD: 'ON_HOLD',
  SOLD: 'SOLD',
} as const;

export type SeatStatusType = (typeof SeatStatus)[keyof typeof SeatStatus];

// 좌석 등급 정보 스키마
export const SeatCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayColor: z.string(),
  price: z.number(),
});

export type SeatCategory = z.infer<typeof SeatCategorySchema>;

// 개별 좌석 정보 스키마
export const SeatInfoSchema = z.object({
  id: z.string().uuid(),
  seatLabel: z.string(),
  categoryId: z.string().uuid(),
  status: z.enum([SeatStatus.AVAILABLE, SeatStatus.ON_HOLD, SeatStatus.SOLD]),
  row: z.number().optional(),
  column: z.number().optional(),
});

export type SeatInfo = z.infer<typeof SeatInfoSchema>;

// 좌석 지도 조회 요청 파라미터
export const SeatMapParamsSchema = z.object({
  concertId: z.string().uuid({ message: 'Concert ID must be a valid UUID.' }),
  scheduleId: z.string().uuid({ message: 'Schedule ID must be a valid UUID.' }).optional(),
});

export type SeatMapParams = z.infer<typeof SeatMapParamsSchema>;

// 좌석 지도 조회 응답
export const SeatMapResponseSchema = z.object({
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  categories: z.array(SeatCategorySchema),
  seats: z.array(SeatInfoSchema),
});

export type SeatMapResponse = z.infer<typeof SeatMapResponseSchema>;

// DB 테이블 row 스키마
export const SeatCategoryRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  name: z.string(),
  display_color: z.string(),
  price: z.string().or(z.number()),
});

export type SeatCategoryRow = z.infer<typeof SeatCategoryRowSchema>;

export const SeatRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  category_id: z.string().uuid(),
  seat_label: z.string(),
});

export type SeatRow = z.infer<typeof SeatRowSchema>;

// 좌석 선점 요청
export const SeatHoldRequestSchema = z.object({
  concertId: z.string().uuid(),
  scheduleId: z.string().uuid().optional(),
  seatIds: z.array(z.string().uuid()).min(1).max(4),
});

export type SeatHoldRequest = z.infer<typeof SeatHoldRequestSchema>;

// 좌석 선점 응답
export const SeatHoldResponseSchema = z.object({
  holdId: z.string().uuid(),
  expiresAt: z.string(),
  seats: z.array(
    z.object({
      id: z.string().uuid(),
      seatLabel: z.string(),
      price: z.number(),
    })
  ),
  totalPrice: z.number(),
});

export type SeatHoldResponse = z.infer<typeof SeatHoldResponseSchema>;

// 좌석 선점 해제 요청
export const SeatReleaseRequestSchema = z.object({
  holdId: z.string().uuid(),
});

export type SeatReleaseRequest = z.infer<typeof SeatReleaseRequestSchema>;

// 좌석 선점 해제 응답
export const SeatReleaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SeatReleaseResponse = z.infer<typeof SeatReleaseResponseSchema>;
