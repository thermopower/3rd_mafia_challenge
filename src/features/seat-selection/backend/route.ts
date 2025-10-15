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
import {
  SeatMapParamsSchema,
  SeatHoldRequestSchema,
  SeatReleaseRequestSchema,
} from './schema';
import {
  getSeatMapByConcertId,
  createSeatHold,
  releaseSeatHold,
} from './service';
import {
  seatSelectionErrorCodes,
  type SeatSelectionServiceError,
} from './error';

export const registerSeatSelectionRoutes = (app: Hono<AppEnv>) => {
  // GET /api/concerts/:concertId/seats - 좌석 지도 조회
  app.get('/api/concerts/:concertId/seats', async (c) => {
    const parsedParams = SeatMapParamsSchema.safeParse({
      concertId: c.req.param('concertId'),
      scheduleId: c.req.query('scheduleId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          seatSelectionErrorCodes.invalidParams,
          'Invalid concert or schedule ID',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(
      `Fetching seat map for concert: ${parsedParams.data.concertId}`,
    );

    const result = await getSeatMapByConcertId(
      supabase,
      parsedParams.data.concertId,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        SeatSelectionServiceError,
        unknown
      >;

      if (
        errorResult.error.code === seatSelectionErrorCodes.seatsFetchError
      ) {
        logger.error('Failed to fetch seat map', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(
      `Successfully fetched ${result.data.seats.length} seats for concert ${parsedParams.data.concertId}`,
    );

    return respond(c, result);
  });

  // POST /api/reservations/hold - 좌석 선점
  app.post('/api/reservations/hold', async (c) => {
    const body = await c.req.json();

    const parsedBody = SeatHoldRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          seatSelectionErrorCodes.invalidParams,
          'Invalid seat hold request',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(
      `Creating seat hold for concert: ${parsedBody.data.concertId}, seats: ${parsedBody.data.seatIds.join(', ')}`,
    );

    const result = await createSeatHold(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        SeatSelectionServiceError,
        unknown
      >;

      if (
        errorResult.error.code === seatSelectionErrorCodes.seatAlreadyHeld
      ) {
        logger.warn('Seat hold conflict', errorResult.error.message);
      } else if (
        errorResult.error.code === seatSelectionErrorCodes.maxSeatsExceeded
      ) {
        logger.warn('Max seats exceeded', errorResult.error.message);
      } else {
        logger.error('Failed to create seat hold', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(
      `Successfully created seat hold: ${result.data.holdId}, expires at: ${result.data.expiresAt}`,
    );

    return respond(c, result);
  });

  // DELETE /api/reservations/hold - 좌석 선점 해제
  app.delete('/api/reservations/hold', async (c) => {
    const body = await c.req.json();

    const parsedBody = SeatReleaseRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          seatSelectionErrorCodes.invalidParams,
          'Invalid seat release request',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`Releasing seat hold: ${parsedBody.data.holdId}`);

    const result = await releaseSeatHold(supabase, parsedBody.data.holdId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        SeatSelectionServiceError,
        unknown
      >;

      if (errorResult.error.code === seatSelectionErrorCodes.holdNotFound) {
        logger.warn('Hold not found', errorResult.error.message);
      } else {
        logger.error('Failed to release seat hold', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(`Successfully released seat hold: ${parsedBody.data.holdId}`);

    return respond(c, result);
  });
};
