import type { Hono } from "hono";
import {
  failure,
  respond,
  type ErrorResult,
} from "@/backend/http/response";
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from "@/backend/hono/context";
import { ConcertDetailParamsSchema } from "@/features/concert-detail/backend/schema";
import {
  getConcertDetailById,
  getConcertMetrics,
} from "./service";
import {
  concertDetailErrorCodes,
  type ConcertDetailServiceError,
} from "./error";

const getUserIdFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "");
};

export const registerConcertDetailRoutes = (app: Hono<AppEnv>) => {
  app.get("/api/concerts/:concertId", async (c) => {
    const parsedParams = ConcertDetailParamsSchema.safeParse({
      concertId: c.req.param("concertId"),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          "INVALID_CONCERT_ID",
          "The provided concert ID is invalid.",
          parsedParams.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const authHeader = c.req.header("Authorization");
    const userId = getUserIdFromHeader(authHeader);

    const result = await getConcertDetailById(
      supabase,
      parsedParams.data.concertId,
      userId
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        ConcertDetailServiceError,
        unknown
      >;

      if (errorResult.error.code === concertDetailErrorCodes.fetchError) {
        logger.error(
          "Failed to fetch concert detail",
          errorResult.error.message
        );
      }

      if (errorResult.error.code === concertDetailErrorCodes.notFound) {
        logger.info("Concert not found", parsedParams.data.concertId);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.get("/api/concerts/:concertId/metrics", async (c) => {
    const parsedParams = ConcertDetailParamsSchema.safeParse({
      concertId: c.req.param("concertId"),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          "INVALID_CONCERT_ID",
          "The provided concert ID is invalid.",
          parsedParams.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getConcertMetrics(
      supabase,
      parsedParams.data.concertId
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<
        ConcertDetailServiceError,
        unknown
      >;

      if (errorResult.error.code === concertDetailErrorCodes.metricsError) {
        logger.error(
          "Failed to fetch concert metrics",
          errorResult.error.message
        );
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
