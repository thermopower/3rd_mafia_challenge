import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  type ConcertListQuery,
  type ConcertListResponse,
  type RecommendedConcertsResponse,
  type ConcertItem,
  ConcertWithSeatsRowSchema,
} from './schema';
import { homeErrorCodes, type HomeServiceError } from './error';

const CONCERTS_TABLE = 'concerts';
const SEATS_TABLE = 'concert_seats';
const CATEGORIES_TABLE = 'concert_seat_categories';
const FAVORITES_TABLE = 'favorite_concerts';
const RESERVATION_ORDER_SEATS_TABLE = 'reservation_order_seats';

const fallbackThumbnail = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/560`;

/**
 * 공연 목록 조회
 */
export const getConcertList = async (
  client: SupabaseClient,
  query: ConcertListQuery,
  userId?: string | null,
): Promise<
  HandlerResult<ConcertListResponse, HomeServiceError, unknown>
> => {
  try {
    const { search, category, sort, page, limit } = query;
    const offset = (page - 1) * limit;

    // 복잡한 쿼리를 위해 RPC 또는 직접 쿼리 사용
    // 여기서는 간단한 조인과 집계를 수행
    let baseQuery = client
      .from(CONCERTS_TABLE)
      .select(`
        id,
        title,
        created_at,
        total_seats:concert_seats(count),
        categories:concert_seat_categories(price)
      `, { count: 'exact' });

    // 검색어 필터
    if (search && search.trim()) {
      baseQuery = baseQuery.ilike('title', `%${search.trim()}%`);
    }

    // 정렬
    switch (sort) {
      case 'latest':
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      case 'popular':
        // 추후 조회수 또는 예매율 기반 정렬
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      case 'price_low':
        // 가격 정렬은 복잡하므로 일단 기본 정렬
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      case 'price_high':
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      default:
        baseQuery = baseQuery.order('created_at', { ascending: false });
    }

    // 페이지네이션
    baseQuery = baseQuery.range(offset, offset + limit - 1);

    const { data: concertsData, error: concertsError, count } = await baseQuery;

    if (concertsError) {
      return failure(500, homeErrorCodes.fetchError, concertsError.message);
    }

    if (!concertsData) {
      return success({
        concerts: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      });
    }

    // 각 공연에 대한 상세 정보 조회 (좌석 수, 가격, 찜 여부)
    const concertIds = concertsData.map((c: any) => c.id);

    // 전체 좌석 수 조회
    const { data: seatsCount } = await client
      .from(SEATS_TABLE)
      .select('concert_id, count', { count: 'exact' })
      .in('concert_id', concertIds);

    // 예약된 좌석 수 조회
    const { data: reservedSeats } = await client
      .from(RESERVATION_ORDER_SEATS_TABLE)
      .select('seat_id, concert_seats!inner(concert_id)')
      .eq('is_active', true)
      .in('concert_seats.concert_id', concertIds);

    // 가격 범위 조회
    const { data: priceRanges } = await client
      .from(CATEGORIES_TABLE)
      .select('concert_id, price')
      .in('concert_id', concertIds);

    // 찜 여부 조회 (로그인 시)
    let favoritesMap: Record<string, boolean> = {};
    if (userId) {
      const { data: favorites } = await client
        .from(FAVORITES_TABLE)
        .select('concert_id')
        .eq('user_id', userId)
        .in('concert_id', concertIds);

      if (favorites) {
        favoritesMap = favorites.reduce((acc, fav) => {
          acc[fav.concert_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // 좌석 수 맵 생성
    const seatsCountMap: Record<string, number> = {};
    if (seatsCount) {
      for (const item of seatsCount as any[]) {
        seatsCountMap[item.concert_id] = item.count || 0;
      }
    }

    // 예약된 좌석 수 맵 생성
    const reservedSeatsMap: Record<string, number> = {};
    if (reservedSeats) {
      for (const item of reservedSeats as any[]) {
        const concertId = item.concert_seats?.concert_id;
        if (concertId) {
          reservedSeatsMap[concertId] = (reservedSeatsMap[concertId] || 0) + 1;
        }
      }
    }

    // 가격 범위 맵 생성
    const priceMap: Record<string, { min: number | null; max: number | null }> = {};
    if (priceRanges) {
      for (const item of priceRanges as any[]) {
        const concertId = item.concert_id;
        const price = parseFloat(item.price);
        if (!priceMap[concertId]) {
          priceMap[concertId] = { min: price, max: price };
        } else {
          if (priceMap[concertId].min === null || price < priceMap[concertId].min!) {
            priceMap[concertId].min = price;
          }
          if (priceMap[concertId].max === null || price > priceMap[concertId].max!) {
            priceMap[concertId].max = price;
          }
        }
      }
    }

    // 공연 아이템 생성
    const concerts: ConcertItem[] = concertsData.map((concert: any) => {
      const totalSeats = seatsCountMap[concert.id] || 0;
      const reserved = reservedSeatsMap[concert.id] || 0;
      const availableSeats = Math.max(0, totalSeats - reserved);

      let status: 'ON_SALE' | 'CLOSED' | 'SOLD_OUT' = 'ON_SALE';
      if (availableSeats === 0 && totalSeats > 0) {
        status = 'SOLD_OUT';
      }

      return {
        id: concert.id,
        title: concert.title,
        thumbnailUrl: fallbackThumbnail(concert.id),
        status,
        minPrice: priceMap[concert.id]?.min ?? null,
        maxPrice: priceMap[concert.id]?.max ?? null,
        availableSeats,
        totalSeats,
        isFavorite: favoritesMap[concert.id] || false,
        createdAt: concert.created_at,
      };
    });

    return success({
      concerts,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + concerts.length,
    });
  } catch (error) {
    return failure(
      500,
      homeErrorCodes.fetchError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};

/**
 * 추천 공연 조회 (최신 공연 기준)
 */
export const getRecommendedConcerts = async (
  client: SupabaseClient,
  userId?: string | null,
): Promise<
  HandlerResult<RecommendedConcertsResponse, HomeServiceError, unknown>
> => {
  try {
    // 최신 공연 6개를 추천으로 제공
    const result = await getConcertList(
      client,
      {
        sort: 'latest',
        page: 1,
        limit: 6,
      },
      userId,
    );

    if (!result.ok) {
      return result;
    }

    return success({
      concerts: result.data.concerts,
    });
  } catch (error) {
    return failure(
      500,
      homeErrorCodes.fetchError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};
