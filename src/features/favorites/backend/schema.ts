import { z } from "zod";

export const FavoriteToggleRequestSchema = z.object({
  concertId: z.string().uuid(),
});

export type FavoriteToggleRequest = z.infer<
  typeof FavoriteToggleRequestSchema
>;

export const FavoriteToggleResponseSchema = z.object({
  isFavorite: z.boolean(),
  message: z.string(),
});

export type FavoriteToggleResponse = z.infer<
  typeof FavoriteToggleResponseSchema
>;
