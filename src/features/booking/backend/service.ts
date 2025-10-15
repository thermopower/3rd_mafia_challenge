import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  BookingSessionResponseSchema,
  BookingPreviewResponseSchema,
  BookingConfirmResponseSchema,
  ReservationOrderRowSchema,
  type BookingSessionResponse,
  type BookingPreviewResponse,
  type BookingConfirmResponse,
  type BookingPreviewRequest,
  type BookingConfirmRequest,
  type BookingSeat,
} from './schema';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from './error';

const RESERVATION_ORDERS_TABLE = 'reservation_orders';
const RESERVATION_ORDER_SEATS_TABLE = 'reservation_order_seats';
const CONCERTS_TABLE = 'concerts';
const CONCERT_SEATS_TABLE = 'concert_seats';
const PROFILES_TABLE = 'profiles';

/**
 * Helper function to build booking session response from order data
 */
const buildBookingSessionResponse = async (
  client: SupabaseClient,
  order: any,
  userId?: string,
): Promise<
  HandlerResult<BookingSessionResponse, BookingServiceError, unknown>
> => {
  if (order.hold_expires_at) {
    const expiresAt = new Date(order.hold_expires_at);
    if (expiresAt < new Date()) {
      return failure(
        410,
        bookingErrorCodes.sessionExpired,
        'Booking session has expired',
      );
    }
  }

  const { data: concert, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title')
    .eq('id', order.concert_id)
    .maybeSingle();

  if (concertError || !concert) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      concertError?.message || 'Concert not found',
    );
  }

  const { data: orderSeats, error: seatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select('seat_id, price')
    .eq('order_id', order.id)
    .eq('is_active', true);

  if (seatsError || !orderSeats || orderSeats.length === 0) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      seatsError?.message || 'No seats found',
    );
  }

  const seatIds = orderSeats.map((os) => os.seat_id);

  const { data: seats, error: seatDetailsError } = await client
    .from(CONCERT_SEATS_TABLE)
    .select('id, seat_label')
    .in('id', seatIds);

  if (seatDetailsError || !seats) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      seatDetailsError?.message || 'Failed to fetch seat details',
    );
  }

  const seatsMap = new Map(seats.map((s) => [s.id, s.seat_label]));

  const bookingSeats: BookingSeat[] = orderSeats.map((os) => ({
    id: os.seat_id,
    seatLabel: seatsMap.get(os.seat_id) || '',
    price: typeof os.price === 'string' ? parseFloat(os.price) : os.price,
  }));

  const totalPrice = bookingSeats.reduce((sum, seat) => sum + seat.price, 0);

  let prefillData;
  if (userId) {
    const { data: profile } = await client
      .from(PROFILES_TABLE)
      .select('full_name, contact_phone')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      prefillData = {
        name: profile.full_name || undefined,
        phone: profile.contact_phone || undefined,
      };
    }
  }

  const response: BookingSessionResponse = {
    holdId: order.id,
    concertId: order.concert_id,
    concertTitle: concert.title,
    concertImageUrl: `https://picsum.photos/seed/${order.concert_id}/320/200`,
    seats: bookingSeats,
    totalPrice,
    expiresAt: order.hold_expires_at || new Date().toISOString(),
    isLoggedIn: !!userId,
    prefillData,
  };

  const validated = BookingSessionResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      'Session response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data);
};

export const getCurrentBookingSession = async (
  client: SupabaseClient,
  userId?: string,
  holdId?: string,
): Promise<
  HandlerResult<BookingSessionResponse, BookingServiceError, unknown>
> => {
  // holdId가 있으면 직접 조회
  if (holdId) {
    const { data: order, error: orderError } = await client
      .from(RESERVATION_ORDERS_TABLE)
      .select('*')
      .eq('id', holdId)
      .eq('status', 'pending')
      .maybeSingle();

    if (orderError) {
      return failure(
        500,
        bookingErrorCodes.fetchError,
        orderError.message,
      );
    }

    if (!order) {
      return failure(
        404,
        bookingErrorCodes.sessionNotFound,
        'No active booking session found with provided hold ID',
      );
    }

    const parsed = ReservationOrderRowSchema.safeParse(order);
    if (!parsed.success) {
      return failure(
        500,
        bookingErrorCodes.validationError,
        'Invalid order data',
        parsed.error.format(),
      );
    }

    return buildBookingSessionResponse(client, parsed.data, userId);
  }

  // holdId가 없으면 userId 또는 비회원으로 조회
  let query = client
    .from(RESERVATION_ORDERS_TABLE)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.is('user_id', null);
  }

  const { data: orders, error: ordersError } = await query.limit(1);

  if (ordersError) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      ordersError.message,
    );
  }

  if (!orders || orders.length === 0) {
    return failure(
      404,
      bookingErrorCodes.sessionNotFound,
      'No active booking session found',
    );
  }

  const order = orders[0];
  const parsed = ReservationOrderRowSchema.safeParse(order);

  if (!parsed.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      'Invalid order data',
      parsed.error.format(),
    );
  }

  return buildBookingSessionResponse(client, parsed.data, userId);
};

export const previewBooking = async (
  client: SupabaseClient,
  request: BookingPreviewRequest,
): Promise<
  HandlerResult<BookingPreviewResponse, BookingServiceError, unknown>
> => {
  const { data: order, error: orderError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select('id, status, hold_expires_at')
    .eq('id', request.holdId)
    .maybeSingle();

  if (orderError) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      orderError.message,
    );
  }

  if (!order) {
    return failure(
      404,
      bookingErrorCodes.sessionNotFound,
      'Booking session not found',
    );
  }

  if (order.status !== 'pending') {
    return failure(
      400,
      bookingErrorCodes.alreadyConfirmed,
      'Booking already confirmed or cancelled',
    );
  }

  if (order.hold_expires_at) {
    const expiresAt = new Date(order.hold_expires_at);
    if (expiresAt < new Date()) {
      return failure(
        410,
        bookingErrorCodes.sessionExpired,
        'Booking session has expired',
      );
    }
  }

  const response: BookingPreviewResponse = {
    valid: true,
    message: 'Booking information is valid',
  };

  const validated = BookingPreviewResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      'Preview response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data);
};

export const confirmBooking = async (
  client: SupabaseClient,
  request: BookingConfirmRequest,
  userId?: string,
): Promise<
  HandlerResult<BookingConfirmResponse, BookingServiceError, unknown>
> => {
  const { data: order, error: orderError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select('id, status, hold_expires_at, concert_id, reservation_number')
    .eq('id', request.holdId)
    .maybeSingle();

  if (orderError) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      orderError.message,
    );
  }

  if (!order) {
    return failure(
      404,
      bookingErrorCodes.sessionNotFound,
      'Booking session not found',
    );
  }

  if (order.status !== 'pending') {
    return failure(
      400,
      bookingErrorCodes.alreadyConfirmed,
      'Booking already confirmed or cancelled',
    );
  }

  if (order.hold_expires_at) {
    const expiresAt = new Date(order.hold_expires_at);
    if (expiresAt < new Date()) {
      await client
        .from(RESERVATION_ORDERS_TABLE)
        .update({ status: 'expired' })
        .eq('id', request.holdId);

      await client
        .from(RESERVATION_ORDER_SEATS_TABLE)
        .update({ is_active: false })
        .eq('order_id', request.holdId);

      return failure(
        410,
        bookingErrorCodes.sessionExpired,
        'Booking session has expired',
      );
    }
  }

  const { data: orderSeats } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select('price')
    .eq('order_id', request.holdId)
    .eq('is_active', true);

  const totalPrice = (orderSeats || []).reduce((sum, seat) => {
    const price = typeof seat.price === 'string' ? parseFloat(seat.price) : seat.price;
    return sum + price;
  }, 0);

  const { error: updateError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      booker_name: request.bookerName,
      booker_contact: request.bookerPhone,
      total_price: totalPrice,
      ...(userId ? { user_id: userId } : {}),
    })
    .eq('id', request.holdId);

  if (updateError) {
    return failure(
      500,
      bookingErrorCodes.confirmationError,
      updateError.message,
    );
  }

  const response: BookingConfirmResponse = {
    orderId: order.id,
    reservationNumber: order.reservation_number,
    redirectTo: `/booking-confirmation?orderId=${order.id}`,
  };

  const validated = BookingConfirmResponseSchema.safeParse(response);

  if (!validated.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      'Confirm response validation failed',
      validated.error.format(),
    );
  }

  return success(validated.data, 201);
};
