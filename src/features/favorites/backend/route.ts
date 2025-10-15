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
import { FavoriteToggleRequestSchema } from "@/features/favorites/backend/schema";
import { toggleFavorite } from "./service";
import {
  favoriteErrorCodes,
  type FavoriteServiceError,
} from "./error";
import { rateLimit, rateLimitPresets } from "@/backend/middleware/rate-limit";

const getUserIdFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "");
};

export const registerFavoriteRoutes = (app: Hono<AppEnv>) => {
  app.post(
    "/api/favorites/toggle",
    rateLimit(rateLimitPresets.favoriteToggle),
    async (c) => {
    const authHeader = c.req.header("Authorization");
    const userId = getUserIdFromHeader(authHeader);

    if (!userId) {
      return respond(
        c,
        failure(401, favoriteErrorCodes.unauthorized, "로그인이 필요합니다.")
      );
    }

    const body = await c.req.json();
    const parsedBody = FavoriteToggleRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          favoriteErrorCodes.validationError,
          "Invalid request body.",
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await toggleFavorite(
      supabase,
      userId,
      parsedBody.data.concertId
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<FavoriteServiceError, unknown>;

      if (errorResult.error.code === favoriteErrorCodes.toggleError) {
        logger.error("Failed to toggle favorite", errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
    },
  );
};
