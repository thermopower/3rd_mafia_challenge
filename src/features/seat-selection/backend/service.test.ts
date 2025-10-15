import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSeatMapByConcertId,
  createSeatHold,
  releaseSeatHold,
} from './service';
import { SeatStatus } from './schema';
import { seatSelectionErrorCodes } from './error';

describe('Seat Selection Service', () => {
  describe('getSeatMapByConcertId', () => {
    it('콘서트 ID로 좌석 맵을 성공적으로 조회해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';
      const concert = { id: concertId, title: '테스트 콘서트' };
      const categories = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          concert_id: concertId,
          name: 'VIP',
          display_color: '#FF0000',
          price: '100000',
        },
      ];
      const seats = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          concert_id: concertId,
          category_id: '123e4567-e89b-12d3-a456-426614174001',
          seat_label: 'A1',
        },
      ];

      const mockClient = {
        from: vi.fn((table: string) => {
          const queries: Record<string, any> = {
            concerts: {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: concert, error: null }),
                }),
              }),
            },
            concert_seat_categories: {
              select: () => ({
                eq: () => Promise.resolve({ data: categories, error: null }),
              }),
            },
            concert_seats: {
              select: () => ({
                eq: () => Promise.resolve({ data: seats, error: null }),
              }),
            },
            reservation_order_seats: {
              select: () => ({
                eq: () => ({
                  in: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            },
            reservation_orders: {
              select: () => ({
                eq: () => ({
                  eq: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            },
          };
          return queries[table] || {};
        }),
      } as unknown as SupabaseClient;

      const result = await getSeatMapByConcertId(mockClient, concertId);

      if (!result.ok) {
        console.error('Result failed:', result.error);
      }

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.concertId).toBe(concertId);
        expect(result.data.concertTitle).toBe('테스트 콘서트');
        expect(result.data.categories).toHaveLength(1);
        expect(result.data.seats).toHaveLength(1);
        expect(result.data.seats[0].status).toBe(SeatStatus.AVAILABLE);
      }
    });

    it('존재하지 않는 콘서트 ID로 404 에러를 반환해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'concerts') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await getSeatMapByConcertId(mockClient, concertId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.concertNotFound,
        );
      }
    });

    it('좌석이 없는 콘서트에 대해 404 에러를 반환해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';
      const concert = { id: concertId, title: '테스트 콘서트' };
      const categories = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          concert_id: concertId,
          name: 'VIP',
          display_color: '#FF0000',
          price: '100000',
        },
      ];

      const mockClient = {
        from: vi.fn((table: string) => {
          const queries: Record<string, any> = {
            concerts: {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: concert, error: null }),
                }),
              }),
            },
            concert_seat_categories: {
              select: () => ({
                eq: () => Promise.resolve({ data: categories, error: null }),
              }),
            },
            concert_seats: {
              select: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            },
          };
          return queries[table] || {};
        }),
      } as unknown as SupabaseClient;

      const result = await getSeatMapByConcertId(mockClient, concertId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.seatsNotFound,
        );
      }
    });
  });

  describe('createSeatHold', () => {
    it('좌석 선점을 성공적으로 생성해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';
      const seatIds = ['123e4567-e89b-12d3-a456-426614174002'];
      const seats = [
        {
          id: seatIds[0],
          seat_label: 'A1',
          category_id: '123e4567-e89b-12d3-a456-426614174001',
        },
      ];
      const categories = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          price: 100000,
        },
      ];
      const orderId = '123e4567-e89b-12d3-a456-426614174003';

      const mockClient = {
        from: vi.fn((table: string) => {
          const queries: Record<string, any> = {
            concert_seats: {
              select: () => ({
                in: () => ({
                  eq: () => Promise.resolve({ data: seats, error: null }),
                }),
              }),
            },
            reservation_order_seats: {
              select: () => ({
                in: () => ({
                  eq: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
              insert: () => Promise.resolve({ data: null, error: null }),
            },
            concert_seat_categories: {
              select: () => ({
                in: () => Promise.resolve({ data: categories, error: null }),
              }),
            },
            reservation_orders: {
              insert: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({ data: { id: orderId }, error: null }),
                }),
              }),
            },
          };
          return queries[table] || {};
        }),
      } as unknown as SupabaseClient;

      const result = await createSeatHold(mockClient, {
        concertId,
        seatIds,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.holdId).toBe(orderId);
        expect(result.data.seats).toHaveLength(1);
        expect(result.data.totalPrice).toBe(100000);
        expect(result.data.expiresAt).toBeDefined();
      }
    });

    it('최대 좌석 수를 초과하면 400 에러를 반환해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';
      const seatIds = [
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174003',
        '123e4567-e89b-12d3-a456-426614174004',
        '123e4567-e89b-12d3-a456-426614174005',
        '123e4567-e89b-12d3-a456-426614174006',
      ];

      const mockClient = {} as unknown as SupabaseClient;

      const result = await createSeatHold(mockClient, {
        concertId,
        seatIds,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.maxSeatsExceeded,
        );
      }
    });

    it('이미 선점된 좌석에 대해 409 에러를 반환해야 함', async () => {
      const concertId = '123e4567-e89b-12d3-a456-426614174000';
      const seatIds = ['123e4567-e89b-12d3-a456-426614174002'];
      const seats = [
        {
          id: seatIds[0],
          seat_label: 'A1',
          category_id: '123e4567-e89b-12d3-a456-426614174001',
        },
      ];
      const existingHolds = [{ seat_id: seatIds[0] }];

      const mockClient = {
        from: vi.fn((table: string) => {
          const queries: Record<string, any> = {
            concert_seats: {
              select: () => ({
                in: () => ({
                  eq: () => Promise.resolve({ data: seats, error: null }),
                }),
              }),
            },
            reservation_order_seats: {
              select: () => ({
                in: () => ({
                  eq: () =>
                    Promise.resolve({ data: existingHolds, error: null }),
                }),
              }),
            },
          };
          return queries[table] || {};
        }),
      } as unknown as SupabaseClient;

      const result = await createSeatHold(mockClient, {
        concertId,
        seatIds,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(409);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.seatAlreadyHeld,
        );
      }
    });
  });

  describe('releaseSeatHold', () => {
    it('좌석 선점을 성공적으로 해제해야 함', async () => {
      const holdId = '123e4567-e89b-12d3-a456-426614174000';
      const order = {
        id: holdId,
        status: 'pending',
        hold_expires_at: new Date().toISOString(),
      };

      const mockClient = {
        from: vi.fn((table: string) => {
          const queries: Record<string, any> = {
            reservation_orders: {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: order, error: null }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            },
            reservation_order_seats: {
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            },
          };
          return queries[table] || {};
        }),
      } as unknown as SupabaseClient;

      const result = await releaseSeatHold(mockClient, holdId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.message).toBe(
          'Seat hold released successfully',
        );
      }
    });

    it('존재하지 않는 hold ID에 대해 404 에러를 반환해야 함', async () => {
      const holdId = '123e4567-e89b-12d3-a456-426614174000';

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'reservation_orders') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await releaseSeatHold(mockClient, holdId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.holdNotFound,
        );
      }
    });

    it('pending 상태가 아닌 예약에 대해 400 에러를 반환해야 함', async () => {
      const holdId = '123e4567-e89b-12d3-a456-426614174000';
      const order = {
        id: holdId,
        status: 'confirmed',
        hold_expires_at: new Date().toISOString(),
      };

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'reservation_orders') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: order, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await releaseSeatHold(mockClient, holdId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(
          seatSelectionErrorCodes.holdReleaseError,
        );
      }
    });
  });
});
