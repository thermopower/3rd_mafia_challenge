import { z } from 'zod';

// 공연 상태 enum
export const ConcertStatusEnum = z.enum(['ON_SALE', 'CLOSED', 'SOLD_OUT']);
export type ConcertStatus = z.infer<typeof ConcertStatusEnum>;

// 정렬 옵션
export const ConcertSortEnum = z.enum(['latest', 'popular', 'price_low', 'price_high']);
export type ConcertSort = z.infer<typeof ConcertSortEnum>;

// 공연 목록 조회 Query 스키마
export const ConcertListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: ConcertSortEnum.optional().default('latest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type ConcertListQuery = z.infer<typeof ConcertListQuerySchema>;

// 공연 기본 정보 응답 스키마
export const ConcertItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  thumbnailUrl: z.string().url(),
  status: ConcertStatusEnum,
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  availableSeats: z.number().int().min(0),
  totalSeats: z.number().int().min(0),
  isFavorite: z.boolean(),
  createdAt: z.string(),
});

export type ConcertItem = z.infer<typeof ConcertItemSchema>;

// 공연 목록 응답 스키마
export const ConcertListResponseSchema = z.object({
  concerts: z.array(ConcertItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;

// 추천 공연 응답 스키마
export const RecommendedConcertsResponseSchema = z.object({
  concerts: z.array(ConcertItemSchema),
});

export type RecommendedConcertsResponse = z.infer<typeof RecommendedConcertsResponseSchema>;

// DB Row 스키마 (concerts 테이블)
export const ConcertRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ConcertRow = z.infer<typeof ConcertRowSchema>;

// DB Row 스키마 (좌석 정보 조인)
export const ConcertWithSeatsRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
  total_seats: z.number().int(),
  available_seats: z.number().int(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
  is_favorite: z.boolean().nullable(),
});

export type ConcertWithSeatsRow = z.infer<typeof ConcertWithSeatsRowSchema>;
