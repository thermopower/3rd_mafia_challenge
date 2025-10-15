import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  reservationLookupErrorCodes,
  type ReservationLookupServiceError,
} from '@/features/reservations/lookup/backend/error';
import type {
  ReservationLookupRequest,
  ReservationLookupResponse,
} from '@/features/reservations/lookup/backend/schema';

export const lookupReservation = async (
  client: SupabaseClient,
  payload: ReservationLookupRequest,
): Promise<
  HandlerResult<ReservationLookupResponse, ReservationLookupServiceError, unknown>
> => {
  try {
    const { data: order, error: orderError } = await client
      .from('reservation_orders')
      .select(
        `
        id,
        reservation_number,
        status,
        concert_id,
        booker_name,
        booker_contact,
        total_price,
        confirmed_at,
        hold_expires_at,
        concerts (
          id,
          title
        )
      `,
      )
      .eq('reservation_number', payload.orderNumber)
      .maybeSingle();

    if (orderError) {
      return failure(
        500,
        reservationLookupErrorCodes.lookupFailed,
        '예약 조회 중 오류가 발생했습니다.',
        orderError.message,
      );
    }

    if (!order) {
      return failure(
        404,
        reservationLookupErrorCodes.notFound,
        '예약 정보를 찾을 수 없습니다. 예약 번호를 확인해주세요.',
      );
    }

    const normalizedContact = payload.contact.replace(/[-\s()]/g, '');
    const normalizedBookerContact = order.booker_contact.replace(
      /[-\s()]/g,
      '',
    );

    if (normalizedContact !== normalizedBookerContact) {
      return failure(
        403,
        reservationLookupErrorCodes.contactMismatch,
        '연락처가 일치하지 않습니다.',
      );
    }

    const { data: seats, error: seatsError } = await client
      .from('reservation_order_seats')
      .select(
        `
        price,
        concert_seats (
          seat_label,
          concert_seat_categories (
            name
          )
        )
      `,
      )
      .eq('order_id', order.id)
      .eq('is_active', true);

    if (seatsError) {
      return failure(
        500,
        reservationLookupErrorCodes.lookupFailed,
        '좌석 정보 조회 중 오류가 발생했습니다.',
        seatsError.message,
      );
    }

    const mappedSeats = (seats || []).map((seat: any) => ({
      seatLabel: seat.concert_seats?.seat_label || '',
      categoryName:
        seat.concert_seats?.concert_seat_categories?.name || 'Unknown',
      price: Number(seat.price || 0),
    }));

    const concert = Array.isArray(order.concerts)
      ? order.concerts[0]
      : order.concerts;

    return success({
      reservationNumber: order.reservation_number,
      status: order.status.toUpperCase() as
        | 'PENDING'
        | 'CONFIRMED'
        | 'CANCELLED'
        | 'EXPIRED',
      concert: {
        id: concert?.id || order.concert_id,
        title: concert?.title || 'Unknown Concert',
        thumbnailUrl: `https://picsum.photos/seed/${order.id}/320/200`,
      },
      seats: mappedSeats,
      bookerName: order.booker_name,
      bookerContact: order.booker_contact,
      totalPrice: Number(order.total_price || 0),
      confirmedAt: order.confirmed_at || null,
      holdExpiresAt: order.hold_expires_at || null,
    });
  } catch (error) {
    return failure(
      500,
      reservationLookupErrorCodes.lookupFailed,
      '예약 조회 중 예상치 못한 오류가 발생했습니다.',
      error instanceof Error ? error.message : String(error),
    );
  }
};
