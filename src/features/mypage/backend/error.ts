export const mypageErrorCodes = {
  unauthorized: "MYPAGE_UNAUTHORIZED",
  reservationNotFound: "MYPAGE_RESERVATION_NOT_FOUND",
  favoriteNotFound: "MYPAGE_FAVORITE_NOT_FOUND",
  fetchReservationsError: "MYPAGE_FETCH_RESERVATIONS_ERROR",
  fetchFavoritesError: "MYPAGE_FETCH_FAVORITES_ERROR",
  validationError: "MYPAGE_VALIDATION_ERROR",
} as const;

export type MypageServiceError =
  (typeof mypageErrorCodes)[keyof typeof mypageErrorCodes];
