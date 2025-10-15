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
import { ReservationLookupRequestSchema } from '@/features/reservations/lookup/backend/schema';
import { lookupReservation } from '@/features/reservations/lookup/backend/service';
import {
  reservationLookupErrorCodes,
  type ReservationLookupServiceError,
} from '@/features/reservations/lookup/backend/error';

export const registerReservationLookupRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/reservations/lookup', async (c) => {
    const body = await c.req.json();
    const parsedBody = ReservationLookupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          reservationLookupErrorCodes.validationError,
          '입력값이 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await lookupReservation(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        ReservationLookupServiceError,
        unknown
      >;
      logger.warn('Reservation lookup failed', {
        code: errorResult.error.code,
        orderNumber: parsedBody.data.orderNumber,
      });
    } else {
      logger.info('Reservation lookup successful', {
        orderNumber: parsedBody.data.orderNumber,
      });
    }

    return respond(c, result);
  });
};
