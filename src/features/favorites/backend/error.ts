export const favoriteErrorCodes = {
  unauthorized: "FAVORITE_UNAUTHORIZED",
  concertNotFound: "FAVORITE_CONCERT_NOT_FOUND",
  toggleError: "FAVORITE_TOGGLE_ERROR",
  validationError: "FAVORITE_VALIDATION_ERROR",
} as const;

export type FavoriteServiceError =
  (typeof favoriteErrorCodes)[keyof typeof favoriteErrorCodes];
