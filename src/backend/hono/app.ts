import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerHomeRoutes } from "@/features/home/backend/route";
import { registerAuthRoutes } from "@/features/auth/backend/route";
import { registerConcertDetailRoutes } from "@/features/concert-detail/backend/route";
import { registerSeatSelectionRoutes } from "@/features/seat-selection/backend/route";
import { registerFavoriteRoutes } from "@/features/favorites/backend/route";
import { registerReservationLookupRoutes } from "@/features/reservations/lookup/backend/route";
import { registerBookingConfirmationRoutes } from "@/features/booking/confirmation/backend/route";
import { registerMypageRoutes } from "@/features/mypage/backend/route";
import { registerBookingRoutes } from "@/features/booking/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use("*", errorBoundary());
  app.use("*", withAppContext());
  app.use("*", withSupabase());

  registerExampleRoutes(app);
  registerHomeRoutes(app);
  registerAuthRoutes(app);
  registerConcertDetailRoutes(app);
  registerSeatSelectionRoutes(app);
  registerFavoriteRoutes(app);
  registerReservationLookupRoutes(app);
  // 주의: BookingRoutes를 BookingConfirmationRoutes보다 먼저 등록해야 함
  // /api/reservations/current가 /api/reservations/:orderId보다 먼저 매칭되어야 함
  registerBookingRoutes(app);
  registerBookingConfirmationRoutes(app);
  registerMypageRoutes(app);

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
