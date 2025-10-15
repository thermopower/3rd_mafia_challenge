import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SeatMapResponseSchema,
  SeatHoldResponseSchema,
  SeatReleaseResponseSchema,
  SeatCategoryRowSchema,
  SeatRowSchema,
  SeatStatus,
  type SeatMapResponse,
  type SeatHoldResponse,
  type SeatReleaseResponse,
  type SeatHoldRequest,
} from './schema';
import {
  seatSelectionErrorCodes,
  type SeatSelectionServiceError,
} from './error';
import { addMinutes } from 'date-fns';

const CONCERT_TABLE = 'concerts';
const SEAT_CATEGORIES_TABLE = 'concert_seat_categories';
const SEATS_TABLE = 'concert_seats';
const RESERVATION_ORDERS_TABLE = 'reservation_orders';
const RESERVATION_ORDER_SEATS_TABLE = 'reservation_order_seats';

const HOLD_DURATION_MINUTES = 10;
const MAX_SEATS_PER_BOOKING = 4;

export const getSeatMapByConcertId = async (
  client: SupabaseClient,
  concertId: string,
): Promise<
  HandlerResult<SeatMapResponse, SeatSelectionServiceError, unknown>
> => {
  // 1. 콘서트 정보 조회
  const { data: concert, error: concertError } = await client
    .from(CONCERT_TABLE)
    .select('id, title')
    .eq('id', concertId)
    .maybeSingle();

  if (concertError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      concertError.message,
    );
  }

  if (!concert) {
    return failure(
      404,
      seatSelectionErrorCodes.concertNotFound,
      'Concert not found',
    );
  }

  // 2. 좌석 등급 정보 조회
  const { data: categories, error: categoriesError } = await client
    .from(SEAT_CATEGORIES_TABLE)
    .select('id, concert_id, name, display_color, price')
    .eq('concert_id', concertId);

  if (categoriesError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      categoriesError.message,
    );
  }

  // 3. 좌석 정보 조회
  const { data: seats, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('id, concert_id, category_id, seat_label')
    .eq('concert_id', concertId);

  if (seatsError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      seatsError.message,
    );
  }

  if (!seats || seats.length === 0) {
    return failure(
      404,
      seatSelectionErrorCodes.seatsNotFound,
      'No seats found for this concert',
    );
  }

  // 4. 좌석별 예약 상태 확인 (is_active = true인 reservation_order_seats 조회)
  const { data: heldSeats, error: heldSeatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select('seat_id, order_id')
    .eq('is_active', true)
    .in(
      'seat_id',
      seats.map((s) => s.id),
    );

  if (heldSeatsError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      heldSeatsError.message,
    );
  }

  const heldSeatIds = new Set((heldSeats || []).map((hs) => hs.seat_id));

  // 5. 확정된 예약 조회 (status = 'confirmed')
  const { data: confirmedOrders, error: confirmedOrdersError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select('id')
    .eq('concert_id', concertId)
    .eq('status', 'confirmed');

  if (confirmedOrdersError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      confirmedOrdersError.message,
    );
  }

  const confirmedOrderIds = new Set(
    (confirmedOrders || []).map((order) => order.id),
  );

  // 6. 확정된 좌석 조회
  const { data: soldSeats, error: soldSeatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select('seat_id, order_id')
    .eq('is_active', true)
    .in('order_id', Array.from(confirmedOrderIds));

  if (soldSeatsError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      soldSeatsError.message,
    );
  }

  const soldSeatIds = new Set((soldSeats || []).map((ss) => ss.seat_id));

  // 7. 데이터 검증 및 매핑
  const parsedCategories = categories
    .map((cat) => {
      const parsed = SeatCategoryRowSchema.safeParse(cat);
      if (!parsed.success) return null;

      return {
        id: parsed.data.id,
        name: parsed.data.name,
        displayColor: parsed.data.display_color,
        price:
          typeof parsed.data.price === 'string'
            ? parseFloat(parsed.data.price)
            : parsed.data.price,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const parsedSeats = seats
    .map((seat, index) => {
      const parsed = SeatRowSchema.safeParse(seat);
      if (!parsed.success) return null;

      let status: (typeof SeatStatus)[keyof typeof SeatStatus] = SeatStatus.AVAILABLE;
      if (soldSeatIds.has(parsed.data.id)) {
        status = SeatStatus.SOLD;
      } else if (heldSeatIds.has(parsed.data.id)) {
        status = SeatStatus.ON_HOLD;
      }

      const row = Math.floor(index / 10);
      const column = index % 10;

      return {
        id: parsed.data.id,
        seatLabel: parsed.data.seat_label,
        categoryId: parsed.data.category_id,
        status,
        row,
        column,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const response = {
    concertId: concert.id,
    concertTitle: concert.title,
    categories: parsedCategories,
    seats: parsedSeats,
  } satisfies SeatMapResponse;

  const validated = SeatMapResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      seatSelectionErrorCodes.validationError,
      'Seat map response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data);
};

export const createSeatHold = async (
  client: SupabaseClient,
  request: SeatHoldRequest,
): Promise<
  HandlerResult<SeatHoldResponse, SeatSelectionServiceError, unknown>
> => {
  const { concertId, seatIds } = request;

  // 1. 좌석 수 제한 검증
  if (seatIds.length > MAX_SEATS_PER_BOOKING) {
    return failure(
      400,
      seatSelectionErrorCodes.maxSeatsExceeded,
      `Maximum ${MAX_SEATS_PER_BOOKING} seats allowed per booking`,
    );
  }

  // 2. 좌석 정보 조회
  const { data: seats, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('id, seat_label, category_id')
    .in('id', seatIds)
    .eq('concert_id', concertId);

  if (seatsError) {
    return failure(
      500,
      seatSelectionErrorCodes.seatsFetchError,
      seatsError.message,
    );
  }

  if (!seats || seats.length !== seatIds.length) {
    return failure(
      404,
      seatSelectionErrorCodes.seatNotFound,
      'One or more seats not found',
    );
  }

  // 3. 좌석 선점 여부 확인 (is_active = true)
  const { data: existingHolds, error: holdsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select('seat_id')
    .in('seat_id', seatIds)
    .eq('is_active', true);

  if (holdsError) {
    return failure(
      500,
      seatSelectionErrorCodes.holdCreationError,
      holdsError.message,
    );
  }

  if (existingHolds && existingHolds.length > 0) {
    return failure(
      409,
      seatSelectionErrorCodes.seatAlreadyHeld,
      'One or more seats are already held or sold',
    );
  }

  // 4. 좌석 가격 조회
  const categoryIds = [...new Set(seats.map((s) => s.category_id))];
  const { data: categories, error: categoriesError } = await client
    .from(SEAT_CATEGORIES_TABLE)
    .select('id, price')
    .in('id', categoryIds);

  if (categoriesError) {
    return failure(
      500,
      seatSelectionErrorCodes.holdCreationError,
      categoriesError.message,
    );
  }

  const priceMap = new Map(
    categories?.map((cat) => [
      cat.id,
      typeof cat.price === 'string' ? parseFloat(cat.price) : cat.price,
    ]),
  );

  // 5. 총 금액 계산
  const seatsWithPrice = seats.map((seat) => ({
    id: seat.id,
    seatLabel: seat.seat_label,
    price: priceMap.get(seat.category_id) || 0,
  }));

  const totalPrice = seatsWithPrice.reduce((sum, seat) => sum + seat.price, 0);

  // 6. 선점 만료 시간 설정
  const expiresAt = addMinutes(new Date(), HOLD_DURATION_MINUTES);

  // 7. reservation_orders 생성 (pending 상태)
  const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const { data: order, error: orderError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .insert({
      reservation_number: reservationNumber,
      concert_id: concertId,
      status: 'pending',
      hold_expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return failure(
      500,
      seatSelectionErrorCodes.holdCreationError,
      orderError?.message || 'Failed to create reservation order',
    );
  }

  // 8. reservation_order_seats 생성
  const orderSeats = seatsWithPrice.map((seat) => ({
    order_id: order.id,
    seat_id: seat.id,
    price: seat.price,
    is_active: true,
  }));

  const { error: orderSeatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .insert(orderSeats);

  if (orderSeatsError) {
    await client.from(RESERVATION_ORDERS_TABLE).delete().eq('id', order.id);

    return failure(
      500,
      seatSelectionErrorCodes.holdCreationError,
      orderSeatsError.message,
    );
  }

  const response = {
    holdId: order.id,
    expiresAt: expiresAt.toISOString(),
    seats: seatsWithPrice,
    totalPrice,
  } satisfies SeatHoldResponse;

  const validated = SeatHoldResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      seatSelectionErrorCodes.validationError,
      'Seat hold response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data);
};

export const releaseSeatHold = async (
  client: SupabaseClient,
  holdId: string,
): Promise<
  HandlerResult<SeatReleaseResponse, SeatSelectionServiceError, unknown>
> => {
  // 1. 예약 정보 조회
  const { data: order, error: orderError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select('id, status, hold_expires_at')
    .eq('id', holdId)
    .maybeSingle();

  if (orderError) {
    return failure(
      500,
      seatSelectionErrorCodes.holdReleaseError,
      orderError.message,
    );
  }

  if (!order) {
    return failure(
      404,
      seatSelectionErrorCodes.holdNotFound,
      'Hold not found',
    );
  }

  if (order.status !== 'pending') {
    return failure(
      400,
      seatSelectionErrorCodes.holdReleaseError,
      'Only pending holds can be released',
    );
  }

  // 2. reservation_order_seats의 is_active를 false로 갱신
  const { error: seatsUpdateError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .update({ is_active: false })
    .eq('order_id', holdId);

  if (seatsUpdateError) {
    return failure(
      500,
      seatSelectionErrorCodes.holdReleaseError,
      seatsUpdateError.message,
    );
  }

  // 3. reservation_orders 상태를 'cancelled'로 갱신
  const { error: orderUpdateError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .update({ status: 'cancelled' })
    .eq('id', holdId);

  if (orderUpdateError) {
    return failure(
      500,
      seatSelectionErrorCodes.holdReleaseError,
      orderUpdateError.message,
    );
  }

  const response = {
    success: true,
    message: 'Seat hold released successfully',
  } satisfies SeatReleaseResponse;

  const validated = SeatReleaseResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      seatSelectionErrorCodes.validationError,
      'Seat release response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data);
};
