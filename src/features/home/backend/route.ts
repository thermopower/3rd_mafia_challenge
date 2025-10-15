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
import { ConcertListQuerySchema } from './schema';
import { getConcertList, getRecommendedConcerts } from './service';
import { homeErrorCodes, type HomeServiceError } from './error';

export const registerHomeRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/concerts
   * 공연 목록 조회
   */
  app.get('/api/concerts', async (c) => {
    const query = c.req.query();
    const parsedQuery = ConcertListQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_CONCERT_QUERY',
          'The provided query parameters are invalid.',
          parsedQuery.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 로그인 사용자 ID 가져오기 (옵셔널)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const result = await getConcertList(supabase, parsedQuery.data, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<HomeServiceError, unknown>;

      if (errorResult.error.code === homeErrorCodes.fetchError) {
        logger.error('Failed to fetch concerts', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  /**
   * GET /api/concerts/recommendations
   * 추천 공연 조회
   */
  app.get('/api/concerts/recommendations', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 로그인 사용자 ID 가져오기 (옵셔널)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const result = await getRecommendedConcerts(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<HomeServiceError, unknown>;

      if (errorResult.error.code === homeErrorCodes.fetchError) {
        logger.error('Failed to fetch recommended concerts', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
