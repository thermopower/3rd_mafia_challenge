import type { Hono } from "hono";
import { respond } from "@/backend/http/response";
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from "@/backend/hono/context";
import { fetchMyReservations, fetchMyFavorites } from "./service";
import { mypageErrorCodes } from "./error";
import { failure } from "@/backend/http/response";

const getUserIdFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "");
};

export const registerMypageRoutes = (app: Hono<AppEnv>) => {
  app.get("/api/mypage/reservations", async (c) => {
    const authHeader = c.req.header("Authorization");
    const userId = getUserIdFromHeader(authHeader);

    if (!userId) {
      return respond(
        c,
        failure(401, mypageErrorCodes.unauthorized, "로그인이 필요합니다.")
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await fetchMyReservations(supabase, userId);

    if (!result.ok) {
      const errorResult = result as {
        ok: false;
        error: { code: string; message: string };
      };
      logger.error("Failed to fetch reservations", errorResult.error.message);
    }

    return respond(c, result);
  });

  app.get("/api/mypage/favorites", async (c) => {
    const authHeader = c.req.header("Authorization");
    const userId = getUserIdFromHeader(authHeader);

    if (!userId) {
      return respond(
        c,
        failure(401, mypageErrorCodes.unauthorized, "로그인이 필요합니다.")
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await fetchMyFavorites(supabase, userId);

    if (!result.ok) {
      const errorResult = result as {
        ok: false;
        error: { code: string; message: string };
      };
      logger.error("Failed to fetch favorites", errorResult.error.message);
    }

    return respond(c, result);
  });
};
