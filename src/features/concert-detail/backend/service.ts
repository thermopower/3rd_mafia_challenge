import type { SupabaseClient } from "@supabase/supabase-js";
import {
  failure,
  success,
  type HandlerResult,
} from "@/backend/http/response";
import {
  ConcertDetailResponseSchema,
  ConcertMetricsResponseSchema,
  ConcertRowSchema,
  SeatCategoryRowSchema,
  type ConcertDetailResponse,
  type ConcertMetricsResponse,
  type SeatCategory,
} from "@/features/concert-detail/backend/schema";
import {
  concertDetailErrorCodes,
  type ConcertDetailServiceError,
} from "@/features/concert-detail/backend/error";

const CONCERTS_TABLE = "concerts";
const SEAT_CATEGORIES_TABLE = "concert_seat_categories";
const CONCERT_SEATS_TABLE = "concert_seats";
const FAVORITE_CONCERTS_TABLE = "favorite_concerts";
const RESERVATION_ORDER_SEATS_TABLE = "reservation_order_seats";

const fallbackThumbnail = (concertId: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(concertId)}/960/540`;

export const getConcertDetailById = async (
  client: SupabaseClient,
  concertId: string,
  userId: string | null
): Promise<
  HandlerResult<ConcertDetailResponse, ConcertDetailServiceError, unknown>
> => {
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select("*")
    .eq("id", concertId)
    .maybeSingle();

  if (concertError) {
    return failure(
      500,
      concertDetailErrorCodes.fetchError,
      concertError.message
    );
  }

  if (!concertData) {
    return failure(
      404,
      concertDetailErrorCodes.notFound,
      "Concert not found"
    );
  }

  const concertParse = ConcertRowSchema.safeParse(concertData);

  if (!concertParse.success) {
    return failure(
      500,
      concertDetailErrorCodes.validationError,
      "Concert row failed validation.",
      concertParse.error.format()
    );
  }

  const { data: categoriesData, error: categoriesError } = await client
    .from(SEAT_CATEGORIES_TABLE)
    .select("*")
    .eq("concert_id", concertId);

  if (categoriesError) {
    return failure(
      500,
      concertDetailErrorCodes.fetchError,
      categoriesError.message
    );
  }

  const seatCategories: SeatCategory[] = [];

  for (const categoryRow of categoriesData || []) {
    const categoryParse = SeatCategoryRowSchema.safeParse(categoryRow);

    if (!categoryParse.success) {
      return failure(
        500,
        concertDetailErrorCodes.validationError,
        "Seat category row failed validation.",
        categoryParse.error.format()
      );
    }

    const { data: seatsData, error: seatsError } = await client
      .from(CONCERT_SEATS_TABLE)
      .select("id")
      .eq("category_id", categoryRow.id);

    if (seatsError) {
      return failure(
        500,
        concertDetailErrorCodes.fetchError,
        seatsError.message
      );
    }

    const totalSeats = categoryParse.data.total_seats || seatsData?.length || 0;

    const { data: bookedSeatsData, error: bookedSeatsError } = await client
      .from(RESERVATION_ORDER_SEATS_TABLE)
      .select("seat_id")
      .eq("is_active", true)
      .in(
        "seat_id",
        seatsData?.map((s) => s.id) || []
      );

    if (bookedSeatsError) {
      return failure(
        500,
        concertDetailErrorCodes.fetchError,
        bookedSeatsError.message
      );
    }

    const bookedCount = bookedSeatsData?.length || 0;
    const availableSeats = totalSeats - bookedCount;

    seatCategories.push({
      id: categoryParse.data.id,
      name: categoryParse.data.name,
      displayColor: categoryParse.data.display_color,
      price: parseFloat(categoryParse.data.price),
      description: categoryParse.data.description,
      totalSeats,
      availableSeats,
    });
  }

  let isFavorite = false;

  if (userId) {
    const { data: favoriteData, error: favoriteError } = await client
      .from(FAVORITE_CONCERTS_TABLE)
      .select("id")
      .eq("user_id", userId)
      .eq("concert_id", concertId)
      .maybeSingle();

    if (!favoriteError && favoriteData) {
      isFavorite = true;
    }
  }

  const concert = concertParse.data;

  const mapped: ConcertDetailResponse = {
    id: concert.id,
    title: concert.title,
    artist: concert.artist,
    description: concert.description,
    venueName: concert.venue_name,
    venueAddress: concert.venue_address,
    startDate: concert.start_date,
    endDate: concert.end_date,
    durationMinutes: concert.duration_minutes,
    ageRating: concert.age_rating,
    notice: concert.notice,
    thumbnailUrl: concert.thumbnail_url || fallbackThumbnail(concert.id),
    status: concert.status as "ON_SALE" | "CLOSE_SOON" | "SOLD_OUT" | "ENDED",
    seatCategories,
    isFavorite,
  };

  const parsed = ConcertDetailResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      concertDetailErrorCodes.validationError,
      "Concert detail payload failed validation.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

export const getConcertMetrics = async (
  client: SupabaseClient,
  concertId: string
): Promise<
  HandlerResult<ConcertMetricsResponse, ConcertDetailServiceError, unknown>
> => {
  const { data: categoriesData, error: categoriesError } = await client
    .from(SEAT_CATEGORIES_TABLE)
    .select("id, total_seats")
    .eq("concert_id", concertId);

  if (categoriesError) {
    return failure(
      500,
      concertDetailErrorCodes.metricsError,
      categoriesError.message
    );
  }

  let totalSeats = 0;
  let bookedSeats = 0;

  for (const category of categoriesData || []) {
    const { data: seatsData, error: seatsError } = await client
      .from(CONCERT_SEATS_TABLE)
      .select("id")
      .eq("category_id", category.id);

    if (seatsError) {
      return failure(
        500,
        concertDetailErrorCodes.metricsError,
        seatsError.message
      );
    }

    const categoryTotalSeats = category.total_seats || seatsData?.length || 0;
    totalSeats += categoryTotalSeats;

    const { data: bookedSeatsData, error: bookedSeatsError } = await client
      .from(RESERVATION_ORDER_SEATS_TABLE)
      .select("seat_id")
      .eq("is_active", true)
      .in(
        "seat_id",
        seatsData?.map((s) => s.id) || []
      );

    if (bookedSeatsError) {
      return failure(
        500,
        concertDetailErrorCodes.metricsError,
        bookedSeatsError.message
      );
    }

    bookedSeats += bookedSeatsData?.length || 0;
  }

  const { count: favoriteCount, error: favoriteError } = await client
    .from(FAVORITE_CONCERTS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("concert_id", concertId);

  if (favoriteError) {
    return failure(
      500,
      concertDetailErrorCodes.metricsError,
      favoriteError.message
    );
  }

  const availableSeats = totalSeats - bookedSeats;
  const bookingRate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

  const metrics: ConcertMetricsResponse = {
    totalSeats,
    bookedSeats,
    availableSeats,
    favoriteCount: favoriteCount || 0,
    bookingRate: Math.round(bookingRate * 100) / 100,
  };

  const parsed = ConcertMetricsResponseSchema.safeParse(metrics);

  if (!parsed.success) {
    return failure(
      500,
      concertDetailErrorCodes.validationError,
      "Concert metrics payload failed validation.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};
