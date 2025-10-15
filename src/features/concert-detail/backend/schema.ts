import { z } from "zod";

// Params schema
export const ConcertDetailParamsSchema = z.object({
  concertId: z.string().uuid({ message: "Concert ID must be a valid UUID." }),
});

export type ConcertDetailParams = z.infer<typeof ConcertDetailParamsSchema>;

// Seat category response schema
export const SeatCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayColor: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  totalSeats: z.number(),
  availableSeats: z.number(),
});

export type SeatCategory = z.infer<typeof SeatCategorySchema>;

// Concert detail response schema
export const ConcertDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string().nullable(),
  description: z.string().nullable(),
  venueName: z.string().nullable(),
  venueAddress: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  ageRating: z.string().nullable(),
  notice: z.string().nullable(),
  thumbnailUrl: z.string(),
  status: z.enum(["ON_SALE", "CLOSE_SOON", "SOLD_OUT", "ENDED"]),
  seatCategories: z.array(SeatCategorySchema),
  isFavorite: z.boolean(),
});

export type ConcertDetailResponse = z.infer<
  typeof ConcertDetailResponseSchema
>;

// Concert metrics response schema
export const ConcertMetricsResponseSchema = z.object({
  totalSeats: z.number(),
  bookedSeats: z.number(),
  availableSeats: z.number(),
  favoriteCount: z.number(),
  bookingRate: z.number(),
});

export type ConcertMetricsResponse = z.infer<
  typeof ConcertMetricsResponseSchema
>;

// Database row schemas
export const ConcertRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string().nullable(),
  description: z.string().nullable(),
  venue_name: z.string().nullable(),
  venue_address: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  age_rating: z.string().nullable(),
  notice: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ConcertRow = z.infer<typeof ConcertRowSchema>;

export const SeatCategoryRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  name: z.string(),
  display_color: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  total_seats: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SeatCategoryRow = z.infer<typeof SeatCategoryRowSchema>;
