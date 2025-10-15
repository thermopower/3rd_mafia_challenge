import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { BookingConfirmationParamsSchema } from '@/features/booking/confirmation/backend/schema';
import { getBookingConfirmationByOrderId } from '@/features/booking/confirmation/backend/service';
import {
  bookingConfirmationErrorCodes,
  type BookingConfirmationErrorCode,
} from '@/features/booking/confirmation/backend/error';

export const registerBookingConfirmationRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/reservations/:orderId
   * 예매 완료 상세 정보 조회
   */
  app.get('/api/reservations/:orderId', async (c) => {
    const parsedParams = BookingConfirmationParamsSchema.safeParse({
      orderId: c.req.param('orderId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ORDER_ID',
          'The provided order ID is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getBookingConfirmationByOrderId(
      supabase,
      parsedParams.data.orderId,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        BookingConfirmationErrorCode,
        unknown
      >;

      // 로깅
      if (
        errorResult.error.code ===
        bookingConfirmationErrorCodes.fetchError
      ) {
        logger.error(
          'Failed to fetch booking confirmation',
          errorResult.error.message,
        );
      }

      if (
        errorResult.error.code ===
        bookingConfirmationErrorCodes.orderNotFound
      ) {
        logger.info(
          `Booking order not found: ${parsedParams.data.orderId}`,
        );
      }

      return respond(c, result);
    }

    logger.info(
      `Booking confirmation retrieved: ${result.data.reservationNumber}`,
    );

    return respond(c, result);
  });
};
