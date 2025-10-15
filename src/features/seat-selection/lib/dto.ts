/**
 * 좌석 선택 기능의 프론트엔드 DTO
 * 백엔드 스키마를 재노출하여 React Query 훅에서 재사용
 */

export {
  SeatStatus,
  SeatCategorySchema,
  SeatInfoSchema,
  SeatMapParamsSchema,
  SeatMapResponseSchema,
  SeatHoldRequestSchema,
  SeatHoldResponseSchema,
  SeatReleaseRequestSchema,
  SeatReleaseResponseSchema,
  type SeatStatusType,
  type SeatCategory,
  type SeatInfo,
  type SeatMapParams,
  type SeatMapResponse,
  type SeatHoldRequest,
  type SeatHoldResponse,
  type SeatReleaseRequest,
  type SeatReleaseResponse,
} from '@/features/seat-selection/backend/schema';
