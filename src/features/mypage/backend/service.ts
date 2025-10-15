import type { SupabaseClient } from "@supabase/supabase-js";
import {
  failure,
  success,
  type HandlerResult,
} from "@/backend/http/response";
import {
  MyReservationsResponseSchema,
  MyFavoritesResponseSchema,
  type MyReservationsResponse,
  type MyFavoritesResponse,
  type ReservationItem,
  type FavoriteConcertItem,
} from "@/features/mypage/backend/schema";
import {
  mypageErrorCodes,
  type MypageServiceError,
} from "@/features/mypage/backend/error";

const RESERVATION_ORDERS_TABLE = "reservation_orders";
const RESERVATION_ORDER_SEATS_TABLE = "reservation_order_seats";
const CONCERTS_TABLE = "concerts";
const CONCERT_SEATS_TABLE = "concert_seats";
const CONCERT_SEAT_CATEGORIES_TABLE = "concert_seat_categories";
const CONCERT_SCHEDULES_TABLE = "concert_schedules";
const FAVORITE_CONCERTS_TABLE = "favorite_concerts";

export const fetchMyReservations = async (
  client: SupabaseClient,
  userId: string
): Promise<
  HandlerResult<MyReservationsResponse, MypageServiceError, unknown>
> => {
  const { data: orders, error: ordersError } = await client
    .from(RESERVATION_ORDERS_TABLE)
    .select(
      `
      id,
      reservation_number,
      concert_id,
      status,
      total_price,
      booker_name,
      booker_contact,
      confirmed_at,
      created_at,
      concerts (
        id,
        title
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return failure(
      500,
      mypageErrorCodes.fetchReservationsError,
      ordersError.message
    );
  }

  if (!orders || orders.length === 0) {
    const emptyResponse: MyReservationsResponse = {
      reservations: [],
      total: 0,
    };

    const parsed = MyReservationsResponseSchema.safeParse(emptyResponse);

    if (!parsed.success) {
      return failure(
        500,
        mypageErrorCodes.validationError,
        "Reservations response failed validation.",
        parsed.error.format()
      );
    }

    return success(parsed.data);
  }

  const orderIds = orders.map((o) => o.id);

  const { data: seats, error: seatsError } = await client
    .from(RESERVATION_ORDER_SEATS_TABLE)
    .select(
      `
      order_id,
      price,
      concert_seats (
        id,
        seat_label,
        concert_seat_categories (
          id,
          name
        )
      )
    `
    )
    .in("order_id", orderIds)
    .eq("is_active", true);

  if (seatsError) {
    return failure(
      500,
      mypageErrorCodes.fetchReservationsError,
      seatsError.message
    );
  }

  const seatsMap = new Map<string, any[]>();
  seats?.forEach((seat) => {
    const orderId = seat.order_id;
    if (!seatsMap.has(orderId)) {
      seatsMap.set(orderId, []);
    }
    seatsMap.get(orderId)?.push(seat);
  });

  const { data: schedules } = await client
    .from(CONCERT_SCHEDULES_TABLE)
    .select("concert_id, performance_date")
    .in(
      "concert_id",
      orders.map((o) => o.concert_id)
    )
    .order("performance_date", { ascending: true })
    .limit(1);

  const schedulesMap = new Map<string, string>();
  schedules?.forEach((s) => {
    if (!schedulesMap.has(s.concert_id)) {
      schedulesMap.set(s.concert_id, s.performance_date);
    }
  });

  const reservations: ReservationItem[] = orders.map((order) => {
    const orderSeats = seatsMap.get(order.id) || [];
    const concert = order.concerts as any;
    const concertDate =
      schedulesMap.get(order.concert_id) || new Date().toISOString();

    return {
      id: order.id,
      reservationNumber: order.reservation_number,
      concertId: order.concert_id,
      concertTitle: concert?.title || "알 수 없는 콘서트",
      concertDate,
      status: order.status as any,
      totalPrice: Number(order.total_price) || 0,
      bookerName: order.booker_name || "",
      bookerContact: order.booker_contact || "",
      seats: orderSeats.map((seat: any) => ({
        seatLabel: seat.concert_seats?.seat_label || "",
        categoryName:
          seat.concert_seats?.concert_seat_categories?.name || "일반",
        price: Number(seat.price) || 0,
      })),
      confirmedAt: order.confirmed_at,
      createdAt: order.created_at,
    };
  });

  const response: MyReservationsResponse = {
    reservations,
    total: reservations.length,
  };

  const parsed = MyReservationsResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      mypageErrorCodes.validationError,
      "Reservations response failed validation.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

export const fetchMyFavorites = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<MyFavoritesResponse, MypageServiceError, unknown>> => {
  const { data: favoritesData, error: favoritesError } = await client
    .from(FAVORITE_CONCERTS_TABLE)
    .select(
      `
      id,
      concert_id,
      created_at,
      concerts (
        id,
        title,
        venue,
        thumbnail_url
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favoritesError) {
    return failure(
      500,
      mypageErrorCodes.fetchFavoritesError,
      favoritesError.message
    );
  }

  if (!favoritesData || favoritesData.length === 0) {
    const emptyResponse: MyFavoritesResponse = {
      favorites: [],
      total: 0,
    };

    const parsed = MyFavoritesResponseSchema.safeParse(emptyResponse);

    if (!parsed.success) {
      return failure(
        500,
        mypageErrorCodes.validationError,
        "Favorites response failed validation.",
        parsed.error.format()
      );
    }

    return success(parsed.data);
  }

  const concertIds = favoritesData
    .map((f) => f.concert_id)
    .filter((id): id is string => !!id);

  const { data: schedules } = await client
    .from(CONCERT_SCHEDULES_TABLE)
    .select("concert_id, performance_date, available_seats, total_seats")
    .in("concert_id", concertIds)
    .order("performance_date", { ascending: true });

  const schedulesMap = new Map<
    string,
    { date: string; isSoldOut: boolean; isUpcoming: boolean }
  >();

  schedules?.forEach((s) => {
    if (!schedulesMap.has(s.concert_id)) {
      const isSoldOut = s.available_seats === 0;
      const isUpcoming = new Date(s.performance_date) > new Date();

      schedulesMap.set(s.concert_id, {
        date: s.performance_date,
        isSoldOut,
        isUpcoming,
      });
    }
  });

  const favorites: FavoriteConcertItem[] = favoritesData.map((fav) => {
    const concert = fav.concerts as any;
    const schedule = schedulesMap.get(fav.concert_id);

    return {
      id: fav.id,
      concertId: fav.concert_id,
      concertTitle: concert?.title || "알 수 없는 콘서트",
      concertDate: schedule?.date || null,
      concertVenue: concert?.venue || null,
      thumbnailUrl: concert?.thumbnail_url || null,
      isSoldOut: schedule?.isSoldOut || false,
      isUpcoming: schedule?.isUpcoming || false,
      favoritedAt: fav.created_at,
    };
  });

  const response: MyFavoritesResponse = {
    favorites,
    total: favorites.length,
  };

  const parsed = MyFavoritesResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      mypageErrorCodes.validationError,
      "Favorites response failed validation.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};
