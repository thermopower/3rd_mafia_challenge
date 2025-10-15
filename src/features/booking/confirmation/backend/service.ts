import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  BookingConfirmationResponseSchema,
  ReservationOrderRowSchema,
  ReservationSeatRowSchema,
  ConcertRowSchema,
  type BookingConfirmationResponse,
  type ReservationOrderRow,
  type ReservationSeatRow,
  type ConcertRow,
  type SeatInfo,
} from '@/features/booking/confirmation/backend/schema';
import {
  bookingConfirmationErrorCodes,
  type BookingConfirmationErrorCode,
} from '@/features/booking/confirmation/backend/error';

const RESERVATION_ORDERS_TABLE = 'reservation_orders';
const RESERVATION_ORDER_SEATS_TABLE = 'reservation_order_seats';
const CONCERTS_TABLE = 'concerts';
const CONCERT_SEATS_TABLE = 'concert_seats';
const CONCERT_SEAT_CATEGORIES_TABLE = 'concert_seat_categories';

/**
 * 예매 번호를 기반으로 예매 상세 정보를 조회합니다.
 */
export const getBookingConfirmationByOrderId = async (
  client: SupabaseClient,
  orderId: string,
): Promise<
  HandlerResult<
    BookingConfirmationResponse,
    BookingConfirmationErrorCode,
    unknown
  >
> => {
  // 1. reservation_orders 조회
  const { data: orderData, error: orderError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select(
      'id, reservation_number, concert_id, user_id, status, confirmed_at, booker_name, booker_contact, total_price, created_at, updated_at',
    )
    .eq('id', orderId)
    .maybeSingle<ReservationOrderRow>();

  if (orderError) {
    return failure(
      500,
      bookingConfirmationErrorCodes.fetchError,
      'Failed to fetch reservation order.',
      orderError.message,
    );
  }

  if (!orderData) {
    return failure(
      404,
      bookingConfirmationErrorCodes.orderNotFound,
      'Reservation order not found.',
    );
  }

  // 2. 예매 상태 검증
  const orderParse = ReservationOrderRowSchema.safeParse(orderData);

  if (!orderParse.success) {
    return failure(
      500,
      bookingConfirmationErrorCodes.validationError,
      'Reservation order validation failed.',
      orderParse.error.format(),
    );
  }

  const order = orderParse.data;

  if (order.status === 'cancelled') {
    return failure(
      409,
      bookingConfirmationErrorCodes.orderCancelled,
      'This reservation has been cancelled.',
    );
  }

  if (order.status === 'expired') {
    return failure(
      410,
      bookingConfirmationErrorCodes.orderExpired,
      'This reservation has expired.',
    );
  }

  // 3. concerts 조회
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title')
    .eq('id', order.concert_id)
    .maybeSingle<ConcertRow>();

  if (concertError || !concertData) {
    return failure(
      500,
      bookingConfirmationErrorCodes.fetchError,
      'Failed to fetch concert information.',
      concertError?.message,
    );
  }

  const concertParse = ConcertRowSchema.safeParse(concertData);

  if (!concertParse.success) {
    return failure(
      500,
      bookingConfirmationErrorCodes.validationError,
      'Concert data validation failed.',
      concertParse.error.format(),
    );
  }

  const concert = concertParse.data;

  // 4. reservation_order_seats 조회 (좌석 정보 조인)
  const { data: seatsData, error: seatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select(
      `
      id,
      order_id,
      seat_id,
      price,
      is_active,
      concert_seats!inner(seat_label),
      concert_seat_categories!inner(name)
    `,
    )
    .eq('order_id', orderId)
    .eq('is_active', true);

  if (seatsError) {
    return failure(
      500,
      bookingConfirmationErrorCodes.fetchError,
      'Failed to fetch seat information.',
      seatsError.message,
    );
  }

  if (!seatsData || seatsData.length === 0) {
    return failure(
      500,
      bookingConfirmationErrorCodes.fetchError,
      'No active seats found for this reservation.',
    );
  }

  // 5. 좌석 정보 매핑
  const seats: SeatInfo[] = seatsData.map((seatRow: any) => {
    const seatLabel =
      seatRow.concert_seats?.seat_label ?? 'Unknown Seat';
    const categoryName =
      seatRow.concert_seat_categories?.name ?? 'Unknown Category';

    return {
      seatId: seatRow.seat_id,
      seatLabel,
      categoryName,
      price: parseFloat(seatRow.price),
    };
  });

  // 6. 응답 데이터 구성
  const response: BookingConfirmationResponse = {
    orderId: order.id,
    reservationNumber: order.reservation_number,
    status: order.status,
    confirmedAt: order.confirmed_at,
    bookerName: order.booker_name ?? 'Unknown',
    bookerContact: order.booker_contact ?? '',
    totalPrice: parseFloat(order.total_price ?? '0'),
    concert: {
      id: concert.id,
      title: concert.title,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(concert.id)}/640/360`,
    },
    seats,
  };

  // 7. 응답 스키마 검증
  const responseParse =
    BookingConfirmationResponseSchema.safeParse(response);

  if (!responseParse.success) {
    return failure(
      500,
      bookingConfirmationErrorCodes.validationError,
      'Response validation failed.',
      responseParse.error.format(),
    );
  }

  return success(responseParse.data);
};
