import { z } from "zod";

// Reservation Item Schema
export const ReservationItemSchema = z.object({
  id: z.string().uuid(),
  reservationNumber: z.string(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertDate: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled", "expired"]),
  totalPrice: z.number(),
  bookerName: z.string(),
  bookerContact: z.string(),
  seats: z.array(
    z.object({
      seatLabel: z.string(),
      categoryName: z.string(),
      price: z.number(),
    })
  ),
  confirmedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type ReservationItem = z.infer<typeof ReservationItemSchema>;

// My Reservations Response Schema
export const MyReservationsResponseSchema = z.object({
  reservations: z.array(ReservationItemSchema),
  total: z.number(),
});

export type MyReservationsResponse = z.infer<
  typeof MyReservationsResponseSchema
>;

// Favorite Concert Item Schema
export const FavoriteConcertItemSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertDate: z.string().nullable(),
  concertVenue: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  isSoldOut: z.boolean(),
  isUpcoming: z.boolean(),
  favoritedAt: z.string(),
});

export type FavoriteConcertItem = z.infer<typeof FavoriteConcertItemSchema>;

// My Favorites Response Schema
export const MyFavoritesResponseSchema = z.object({
  favorites: z.array(FavoriteConcertItemSchema),
  total: z.number(),
});

export type MyFavoritesResponse = z.infer<typeof MyFavoritesResponseSchema>;
