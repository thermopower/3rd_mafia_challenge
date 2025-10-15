import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  getConfig,
  type AppEnv,
} from '@/backend/hono/context';
import { createCookieBasedClient } from '@/backend/supabase/cookie-client';
import {
  BookingPreviewRequestSchema,
  BookingConfirmRequestSchema,
} from './schema';
import {
  getCurrentBookingSession,
  previewBooking,
  confirmBooking,
} from './service';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from './error';

export const registerBookingRoutes = (app: Hono<AppEnv>) => {
  // GET /api/reservations/current - 현재 선점 정보 조회
  app.get('/api/reservations/current', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

    // 쿠키에서 사용자 세션 가져오기
    const authClient = createCookieBasedClient(
      c,
      config.supabase.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user } } = await authClient.auth.getUser();
    const userId = user?.id;
    const userEmail = user?.email;
    const holdId = c.req.header('x-hold-id') || undefined;

    logger.info(`Fetching current booking session (userId: ${userId || 'anonymous'}, holdId: ${holdId || 'none'})`);

    const result = await getCurrentBookingSession(supabase, userId, holdId, userEmail);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        BookingServiceError,
        unknown
      >;

      if (errorResult.error.code === bookingErrorCodes.sessionNotFound) {
        logger.warn('No active booking session found');
      } else if (errorResult.error.code === bookingErrorCodes.sessionExpired) {
        logger.warn('Booking session has expired');
      } else {
        logger.error('Failed to fetch booking session', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(
      `Successfully fetched booking session: ${result.data.holdId}`,
    );

    return respond(c, result);
  });

  // POST /api/reservations/preview - 예매 사전 검증
  app.post('/api/reservations/preview', async (c) => {
    const body = await c.req.json();
    const parsedBody = BookingPreviewRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.invalidParams,
          'Invalid booking preview request',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`Previewing booking for hold: ${parsedBody.data.holdId}`);

    const result = await previewBooking(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        BookingServiceError,
        unknown
      >;

      if (errorResult.error.code === bookingErrorCodes.sessionExpired) {
        logger.warn('Booking session has expired during preview');
      } else {
        logger.error('Failed to preview booking', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(`Booking preview successful for hold: ${parsedBody.data.holdId}`);

    return respond(c, result);
  });

  // POST /api/reservations/confirm - 예매 확정
  app.post('/api/reservations/confirm', async (c) => {
    const body = await c.req.json();
    const parsedBody = BookingConfirmRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.invalidParams,
          'Invalid booking confirm request',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

    // 쿠키에서 사용자 세션 가져오기
    const authClient = createCookieBasedClient(
      c,
      config.supabase.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user } } = await authClient.auth.getUser();
    const userId = user?.id;

    logger.info(`Confirming booking for hold: ${parsedBody.data.holdId} (userId: ${userId || 'anonymous'})`);

    const result = await confirmBooking(supabase, parsedBody.data, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        BookingServiceError,
        unknown
      >;

      if (errorResult.error.code === bookingErrorCodes.sessionExpired) {
        logger.warn('Booking session has expired during confirmation');
      } else if (errorResult.error.code === bookingErrorCodes.alreadyConfirmed) {
        logger.warn('Booking already confirmed or cancelled');
      } else {
        logger.error('Failed to confirm booking', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(
      `Successfully confirmed booking: ${result.data.orderId}, reservation: ${result.data.reservationNumber}`,
    );

    return respond(c, result);
  });
};
